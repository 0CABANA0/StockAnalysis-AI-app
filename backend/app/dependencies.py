from functools import lru_cache

from supabase import Client, create_client

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)


@lru_cache
def get_supabase() -> Client:
    """Supabase service_role 클라이언트 싱글턴."""
    if not settings.supabase_url or not settings.supabase_service_key:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set. "
            "Check .env file or environment variables."
        )
    logger.info("Initializing Supabase client for %s", settings.supabase_url)
    return create_client(settings.supabase_url, settings.supabase_service_key)
