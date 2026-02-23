"""APScheduler 기반 크론잡 — 거시 데이터 자동 수집 + 뉴스 감성 분석."""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.dependencies import get_supabase
from app.services.macro_collector import collect_macro_data
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
            "Scheduled sentiment done — collected=%d, analyzed=%d, failed=%d",
            result.collected_count,
            result.analyzed_count,
            result.failed_count,
        )
    except Exception as e:
        logger.error("Scheduled sentiment collection failed: %s", e)


def start_scheduler():
    """스케줄러를 시작한다.

    - 거시 수집: 07:00 / 13:00 / 18:00 KST
    - 감성 분석: 08:00 / 14:00 / 19:00 KST (거시 수집 1시간 후)
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
    scheduler.start()
    logger.info(
        "Scheduler started — macro at 07/13/18 KST, sentiment at 08/14/19 KST"
    )


def stop_scheduler():
    """스케줄러를 안전하게 종료한다."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
