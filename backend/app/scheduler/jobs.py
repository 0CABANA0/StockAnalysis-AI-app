"""APScheduler 기반 크론잡 — 거시 수집 + 감성 분석 + 통합 스코어링."""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.dependencies import get_supabase
from app.services.macro_collector import collect_macro_data
from app.services import prediction_service
from app.services.sentiment_service import collect_and_analyze
from app.services.supabase_client import insert_snapshot
from app.utils.logger import get_logger

logger = get_logger(__name__)

scheduler = BackgroundScheduler(timezone="Asia/Seoul")


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


def start_scheduler():
    """스케줄러를 시작한다.

    - 거시 수집:     07:00 / 13:00 / 18:00 KST
    - 감성 분석:     08:00 / 14:00 / 19:00 KST (거시 +1h)
    - 통합 스코어링: 09:00 / 15:00 / 20:00 KST (감성 +1h)
    """
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
    scheduler.start()
    logger.info(
        "Scheduler started — macro 07/13/18, sentiment 08/14/19, "
        "prediction 09/15/20 KST"
    )


def stop_scheduler():
    """스케줄러를 안전하게 종료한다."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
