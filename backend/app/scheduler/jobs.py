"""APScheduler 기반 크론잡 — 거시 데이터 자동 수집."""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.dependencies import get_supabase
from app.services.macro_collector import collect_macro_data
from app.services.supabase_client import insert_snapshot
from app.utils.logger import get_logger

logger = get_logger(__name__)

scheduler = BackgroundScheduler(timezone="Asia/Seoul")


def _scheduled_collect():
    """스케줄러에 의해 호출되는 수집 작업."""
    logger.info("Scheduled macro collection started")
    try:
        snapshot, failed, collected_at = collect_macro_data()
        client = get_supabase()
        insert_snapshot(client, snapshot, collected_at)
        logger.info(
            "Scheduled collection done — %d failed tickers",
            len(failed),
        )
    except Exception as e:
        logger.error("Scheduled collection failed: %s", e)


def start_scheduler():
    """매일 07:00, 13:00, 18:00 KST에 거시 데이터를 수집하는 스케줄러를 시작한다."""
    scheduler.add_job(
        _scheduled_collect,
        trigger=CronTrigger(hour="7,13,18", timezone="Asia/Seoul"),
        id="macro_collection",
        name="Macro Data Collection",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("Scheduler started — macro collection at 07:00/13:00/18:00 KST")


def stop_scheduler():
    """스케줄러를 안전하게 종료한다."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped")
