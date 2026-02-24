from fastapi import APIRouter, Depends, Query
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user
from app.models.fear_greed import FearGreedResponse, FearGreedSnapshot
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/fear-greed", tags=["fear-greed"])


@router.get("/", response_model=FearGreedResponse)
def get_fear_greed(
    history_limit: int = Query(default=30, ge=1, le=365),
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """공포/탐욕 지수 (현재 + 이력)."""
    # 최신 1건
    latest = client.table("fear_greed_snapshots").select("*").order("snapshot_at", desc=True).limit(1).execute()
    current = FearGreedSnapshot(**latest.data[0]) if latest.data else None

    # 이력
    history_result = client.table("fear_greed_snapshots").select("*").order("snapshot_at", desc=True).limit(history_limit).execute()
    history = [FearGreedSnapshot(**s) for s in (history_result.data or [])]

    return FearGreedResponse(current=current, history=history)
