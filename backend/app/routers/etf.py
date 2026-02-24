"""ETF/펀드 API — 동기화, 목록, 상세, 카테고리, 거시-ETF 추천."""

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user, require_admin
from app.models.etf import (
    EtfFundMasterResponse,
    EtfListResponse,
    EtfSyncResponse,
    MacroEtfSuggestionsResponse,
)
from app.services import etf_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/etf", tags=["etf"])

VALID_SORT_FIELDS = {"name", "ticker", "nav", "ter", "aum", "category", "updated_at"}
VALID_ASSET_TYPES = {"DOMESTIC_ETF", "FOREIGN_ETF", "DOMESTIC_FUND"}


# ─── 정적 경로를 {ticker} 앞에 정의 ───


@router.post("/sync", response_model=EtfSyncResponse)
def sync_etf_data(
    _admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """ETF/펀드 외부 소스(yfinance, FDR, KOFIA) 동기화. ADMIN 전용."""
    try:
        return etf_service.sync_all(client)
    except Exception as e:
        logger.error("ETF sync failed: %s", e)
        raise HTTPException(status_code=500, detail=f"ETF 동기화 실패: {e}")


@router.get("/categories", response_model=list[str])
def get_categories(
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """ETF/펀드 카테고리 목록을 반환한다."""
    try:
        return etf_service.get_distinct_categories(client)
    except Exception as e:
        logger.error("Category list failed: %s", e)
        raise HTTPException(status_code=500, detail=f"카테고리 조회 실패: {e}")


@router.get("/macro/suggestions", response_model=MacroEtfSuggestionsResponse)
def get_macro_suggestions(
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """현재 거시경제 상황에 맞는 ETF 추천을 반환한다."""
    try:
        return etf_service.get_macro_etf_suggestions(client)
    except Exception as e:
        logger.error("Macro ETF suggestions failed: %s", e)
        raise HTTPException(status_code=500, detail=f"거시-ETF 추천 실패: {e}")


@router.get("/list", response_model=EtfListResponse)
def get_etf_list(
    asset_type: str | None = Query(default=None, description="자산 유형 (DOMESTIC_ETF, FOREIGN_ETF, DOMESTIC_FUND)"),
    category: str | None = Query(default=None, description="카테고리"),
    min_aum: float | None = Query(default=None, description="최소 AUM"),
    is_active: bool | None = Query(default=None, description="활성 여부"),
    sort_by: str = Query(default="name", description="정렬 기준"),
    sort_desc: bool = Query(default=False, description="내림차순 여부"),
    limit: int = Query(default=20, ge=1, le=500, description="페이지 크기"),
    offset: int = Query(default=0, ge=0, description="오프셋"),
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """ETF/펀드 필터링 + 페이지네이션 목록을 반환한다."""
    if asset_type and asset_type not in VALID_ASSET_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 자산 유형입니다. 가능: {', '.join(sorted(VALID_ASSET_TYPES))}",
        )
    if sort_by not in VALID_SORT_FIELDS:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 정렬 기준입니다. 가능: {', '.join(sorted(VALID_SORT_FIELDS))}",
        )

    try:
        items, total = etf_service.list_etf_funds(
            client,
            asset_type=asset_type,
            category=category,
            min_aum=min_aum,
            is_active=is_active,
            sort_by=sort_by,
            sort_desc=sort_desc,
            limit=limit,
            offset=offset,
        )
        return EtfListResponse(items=items, total=total, limit=limit, offset=offset)
    except Exception as e:
        logger.error("ETF list failed: %s", e)
        raise HTTPException(status_code=500, detail=f"ETF 목록 조회 실패: {e}")


# ─── 동적 경로는 반드시 마지막 ───


@router.get("/{ticker}", response_model=EtfFundMasterResponse)
def get_etf_detail(
    ticker: str,
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """ETF/펀드 상세 정보를 반환한다."""
    try:
        result = etf_service.get_by_ticker(client, ticker)
    except Exception as e:
        logger.error("ETF detail failed for %s: %s", ticker, e)
        raise HTTPException(status_code=500, detail=f"ETF 상세 조회 실패: {e}")

    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"'{ticker}'에 해당하는 ETF/펀드를 찾을 수 없습니다.",
        )
    return result
