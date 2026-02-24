from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user
from app.models.watchlist import WatchlistAddRequest, WatchlistItem, WatchlistResponse
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


@router.get("/", response_model=WatchlistResponse)
def get_watchlist(
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """관심 종목 목록."""
    result = client.table("watchlist").select("*").eq("user_id", user.user_id).order("added_at", desc=True).execute()
    items = [WatchlistItem(**i) for i in (result.data or [])]
    return WatchlistResponse(items=items, total=len(items))


@router.post("/", response_model=WatchlistItem)
def add_to_watchlist(
    req: WatchlistAddRequest,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """관심 종목 추가."""
    data = {
        "user_id": user.user_id,
        "ticker": req.ticker,
        "company_name": req.company_name,
        "market": req.market,
        "asset_type": req.asset_type,
    }
    result = client.table("watchlist").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to add watchlist item")
    return WatchlistItem(**result.data[0])


@router.delete("/{item_id}")
def remove_from_watchlist(
    item_id: str,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """관심 종목 제거."""
    client.table("watchlist").delete().eq("id", item_id).eq("user_id", user.user_id).execute()
    return {"success": True}
