"""APScheduler 기반 크론잡 — ETF 동기화 + 거시 수집 + 감성 분석 + 통합 스코어링."""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.dependencies import get_supabase
from app.services import alert_service, etf_service, prediction_service
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

    - ETF 동기화:    06:30 KST (1일 1회)
    - 거시 수집:     07:00 / 13:00 / 18:00 KST
    - 감성 분석:     08:00 / 14:00 / 19:00 KST (거시 +1h)
    - 통합 스코어링: 09:00 / 15:00 / 20:00 KST (감성 +1h)
    - 리스크 알림:   09:30 / 15:30 / 20:30 KST (스코어링 +30m)
    - 가격 알림:     07:00~23:50, 10분 간격
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
        _scheduled_sentiment_collect,
        trigger=CronTrigger(hour="8,14,19", timezone="Asia/Seoul"),
        id="sentiment_collection",
        name="News Sentiment Analysis",
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
    scheduler.start()
    logger.info(
        "Scheduler started — etf 06:30, macro 07/13/18, sentiment 08/14/19, "
        "prediction 09/15/20, risk 09:30/15:30/20:30, "
        "price-alert every 10min (07~23) KST"
    )


def stop_scheduler():
    """스케줄러를 안전하게 종료한다."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
