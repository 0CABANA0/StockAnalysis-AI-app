"""APScheduler 기반 크론잡 — ETF 동기화 + 거시 수집 + 감성 분석 + 통합 스코어링 + 지정학 + 공포탐욕 + 가이드."""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.dependencies import get_supabase
from app.services import (
    alert_service,
    etf_service,
    fear_greed_service,
    geo_service,
    guide_service,
    prediction_service,
    weekly_report_service,
)
from app.services.macro_collector import collect_macro_data
from app.services.sentiment_service import collect_and_analyze
from app.services.supabase_client import insert_snapshot
from app.utils.logger import get_logger

logger = get_logger(__name__)

scheduler = BackgroundScheduler(timezone="Asia/Seoul")


def _scheduled_etf_sync():
    """스케줄러에 의해 호출되는 ETF/펀드 동기화 작업."""
    logger.info("Scheduled ETF sync started")
    try:
        client = get_supabase()
        result = etf_service.sync_all(client)
        logger.info(
            "Scheduled ETF sync done — foreign=%d, domestic=%d, fund=%d, failed=%d",
            result.foreign_count,
            result.domestic_count,
            result.fund_count,
            len(result.failed_tickers),
        )
    except Exception as e:
        logger.error("Scheduled ETF sync failed: %s", e)


def _scheduled_macro_collect():
    """스케줄러에 의해 호출되는 거시 데이터 수집 작업."""
    logger.info("Scheduled macro collection started")
    try:
        snapshot, failed, collected_at = collect_macro_data()
        client = get_supabase()
        insert_snapshot(client, snapshot, collected_at)
        logger.info(
            "Scheduled macro collection done — %d failed tickers",
            len(failed),
        )
    except Exception as e:
        logger.error("Scheduled macro collection failed: %s", e)


def _scheduled_geo_collect():
    """스케줄러에 의해 호출되는 지정학 뉴스 수집 + AI 분류 작업."""
    logger.info("Scheduled geo collection started")
    try:
        client = get_supabase()
        result = geo_service.collect_and_analyze(client)
        logger.info(
            "Scheduled geo done — collected=%d, events=%d",
            result.get("articles_collected", 0),
            result.get("events_created", 0),
        )
    except Exception as e:
        logger.error("Scheduled geo collection failed: %s", e)


def _scheduled_sentiment_collect():
    """스케줄러에 의해 호출되는 뉴스 감성 분석 작업."""
    logger.info("Scheduled sentiment collection started")
    try:
        client = get_supabase()
        result = collect_and_analyze(client)
        logger.info(
            "Scheduled sentiment done — collected=%d, analyzed=%d",
            result.articles_collected,
            result.articles_analyzed,
        )
    except Exception as e:
        logger.error("Scheduled sentiment collection failed: %s", e)


def _scheduled_fear_greed_collect():
    """스케줄러에 의해 호출되는 공포/탐욕 지수 계산 작업."""
    logger.info("Scheduled fear/greed collection started")
    try:
        client = get_supabase()
        result = fear_greed_service.collect_fear_greed(client)
        logger.info(
            "Scheduled fear/greed done — index=%d (%s)",
            result.get("index_value", 0),
            result.get("label", "N/A"),
        )
    except Exception as e:
        logger.error("Scheduled fear/greed collection failed: %s", e)


def _scheduled_prediction_scoring():
    """스케줄러에 의해 호출되는 통합 스코어링 작업.

    portfolio 테이블에서 is_deleted=False 종목을 조회하고,
    user_id+ticker 중복 제거 후 순차 분석한다.
    """
    logger.info("Scheduled prediction scoring started")
    try:
        client = get_supabase()

        # 활성 포트폴리오에서 고유 (user_id, ticker) 쌍 추출
        result = (
            client.table("portfolio")
            .select("user_id, ticker, company_name")
            .eq("is_deleted", False)
            .execute()
        )
        rows = result.data or []

        # 중복 제거: (user_id, ticker) 기준
        seen: set[tuple[str, str]] = set()
        unique_targets: list[dict] = []
        for row in rows:
            key = (row["user_id"], row["ticker"])
            if key not in seen:
                seen.add(key)
                unique_targets.append(row)

        logger.info(
            "Prediction scoring targets: %d unique (user, ticker) pairs",
            len(unique_targets),
        )

        success_count = 0
        for target in unique_targets:
            try:
                prediction_service.analyze_ticker(
                    client=client,
                    ticker=target["ticker"],
                    user_id=target["user_id"],
                    company_name=target.get("company_name"),
                )
                success_count += 1
            except Exception as e:
                logger.error(
                    "Prediction failed for %s/%s: %s",
                    target["user_id"],
                    target["ticker"],
                    e,
                )

        logger.info(
            "Scheduled prediction scoring done — %d/%d succeeded",
            success_count,
            len(unique_targets),
        )
    except Exception as e:
        logger.error("Scheduled prediction scoring failed: %s", e)


def _scheduled_guide_generation():
    """스케줄러에 의해 호출되는 일간 투자 가이드 생성 작업."""
    logger.info("Scheduled guide generation started")
    try:
        client = get_supabase()
        result = guide_service.generate_daily_guide(client)
        logger.info(
            "Scheduled guide done — date=%s, success=%s",
            result.get("briefing_date", "N/A"),
            result.get("success", False),
        )
    except Exception as e:
        logger.error("Scheduled guide generation failed: %s", e)


def _scheduled_weekly_report():
    """스케줄러에 의해 호출되는 주간 리포트 생성 작업 (매주 일요일 21:00 KST)."""
    logger.info("Scheduled weekly report generation started")
    try:
        client = get_supabase()
        result = weekly_report_service.generate_weekly_report(client)
        logger.info(
            "Scheduled weekly report done — week=%s, success=%s",
            result.get("week_start_date", "N/A"),
            result.get("success", False),
        )
    except Exception as e:
        logger.error("Scheduled weekly report generation failed: %s", e)


def _scheduled_price_alert_check():
    """스케줄러에 의해 호출되는 가격 알림 체크 작업."""
    logger.info("Scheduled price alert check started")
    try:
        client = get_supabase()
        result = alert_service.check_price_alerts(client)
        logger.info(
            "Scheduled price alert check done — checked=%d, triggered=%d",
            result.checked_count,
            result.triggered_count,
        )
    except Exception as e:
        logger.error("Scheduled price alert check failed: %s", e)


def _scheduled_risk_alert_check():
    """스케줄러에 의해 호출되는 리스크 조건 체크 작업."""
    logger.info("Scheduled risk alert check started")
    try:
        client = get_supabase()
        result = alert_service.check_risk_conditions(client)
        logger.info(
            "Scheduled risk check done — vix=%s, geo=%s, currency=%s, sent=%d",
            result.vix_alert,
            result.geopolitical_alert,
            result.currency_alert,
            result.notifications_sent,
        )
    except Exception as e:
        logger.error("Scheduled risk alert check failed: %s", e)


def start_scheduler():
    """스케줄러를 시작한다.

    - ETF 동기화:       06:30 KST (1일 1회)
    - 거시 수집:        07:00 / 13:00 / 18:00 KST
    - 지정학 수집:      07:30 / 13:30 / 18:30 KST (거시 +30m)
    - 감성 분석:        08:00 / 14:00 / 19:00 KST (지정학 +30m)
    - 공포/탐욕 계산:   08:30 / 14:30 / 19:30 KST (감성 +30m)
    - 통합 스코어링:    09:00 / 15:00 / 20:00 KST (공포탐욕 +30m)
    - 리스크 알림:      09:30 / 15:30 / 20:30 KST (스코어링 +30m)
    - 가이드 생성:      09:30 / 15:30 / 20:30 KST (리스크와 동시)
    - 가격 알림:        07:00~23:50, 10분 간격
    """
    scheduler.add_job(
        _scheduled_etf_sync,
        trigger=CronTrigger(hour=6, minute=30, timezone="Asia/Seoul"),
        id="etf_sync",
        name="ETF/Fund Sync",
        replace_existing=True,
    )
    scheduler.add_job(
        _scheduled_macro_collect,
        trigger=CronTrigger(hour="7,13,18", timezone="Asia/Seoul"),
        id="macro_collection",
        name="Macro Data Collection",
        replace_existing=True,
    )
    scheduler.add_job(
        _scheduled_geo_collect,
        trigger=CronTrigger(hour="7,13,18", minute="30", timezone="Asia/Seoul"),
        id="geo_collection",
        name="Geopolitical News Collection",
        replace_existing=True,
    )
    scheduler.add_job(
        _scheduled_sentiment_collect,
        trigger=CronTrigger(hour="8,14,19", timezone="Asia/Seoul"),
        id="sentiment_collection",
        name="News Sentiment Analysis",
        replace_existing=True,
    )
    scheduler.add_job(
        _scheduled_fear_greed_collect,
        trigger=CronTrigger(hour="8,14,19", minute="30", timezone="Asia/Seoul"),
        id="fear_greed_collection",
        name="Fear & Greed Index Calculation",
        replace_existing=True,
    )
    scheduler.add_job(
        _scheduled_prediction_scoring,
        trigger=CronTrigger(hour="9,15,20", timezone="Asia/Seoul"),
        id="prediction_scoring",
        name="Prediction Scoring",
        replace_existing=True,
    )
    scheduler.add_job(
        _scheduled_price_alert_check,
        trigger=CronTrigger(
            hour="7-23", minute="*/10", timezone="Asia/Seoul",
        ),
        id="price_alert_check",
        name="Price Alert Check",
        replace_existing=True,
    )
    scheduler.add_job(
        _scheduled_risk_alert_check,
        trigger=CronTrigger(
            hour="9,15,20", minute="30", timezone="Asia/Seoul",
        ),
        id="risk_alert_check",
        name="Risk Alert Check",
        replace_existing=True,
    )
    scheduler.add_job(
        _scheduled_guide_generation,
        trigger=CronTrigger(
            hour="9,15,20", minute="30", timezone="Asia/Seoul",
        ),
        id="guide_generation",
        name="Daily Guide Generation",
        replace_existing=True,
    )
    scheduler.add_job(
        _scheduled_weekly_report,
        trigger=CronTrigger(
            day_of_week="sun", hour=21, minute=0, timezone="Asia/Seoul",
        ),
        id="weekly_report",
        name="Weekly Report Generation",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "Scheduler started — etf 06:30, macro 07/13/18, geo 07:30/13:30/18:30, "
        "sentiment 08/14/19, fear-greed 08:30/14:30/19:30, "
        "prediction 09/15/20, risk+guide 09:30/15:30/20:30, "
        "price-alert every 10min (07~23), weekly-report Sun 21:00 KST"
    )


def stop_scheduler():
    """스케줄러를 안전하게 종료한다."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
