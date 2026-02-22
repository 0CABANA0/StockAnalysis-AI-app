from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user, require_admin
from app.models.macro import (
    MacroCollectResponse,
    MacroHistoryResponse,
    MacroSnapshotResponse,
)
from app.services.macro_collector import collect_macro_data
from app.services.supabase_client import get_history, get_latest, insert_snapshot
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/macro", tags=["macro"])


@router.post("/collect", response_model=MacroCollectResponse)
def collect(
    _admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """거시경제 데이터를 수집하고 DB에 저장한다. (ADMIN 전용)"""
    logger.info("Manual macro collection triggered")
    snapshot, failed, collected_at = collect_macro_data()

    try:
        insert_snapshot(client, snapshot, collected_at)
    except Exception as e:
        logger.error("Failed to save snapshot: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Data collected but DB save failed: {e}",
        )

    return MacroCollectResponse(
        success=True,
        collected_at=collected_at,
        snapshot=snapshot,
        failed_tickers=failed,
    )


@router.get("/latest", response_model=MacroSnapshotResponse)
def latest(
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """최신 거시 스냅샷 1건을 반환한다."""
    result = get_latest(client)
    if result is None:
        raise HTTPException(status_code=404, detail="No snapshots found")
    return result


@router.get("/history", response_model=MacroHistoryResponse)
def history(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """거시 스냅샷 이력을 페이지네이션으로 반환한다."""
    snapshots, total = get_history(client, limit=limit, offset=offset)
    return MacroHistoryResponse(
        snapshots=snapshots,
        total=total,
        limit=limit,
        offset=offset,
    )
