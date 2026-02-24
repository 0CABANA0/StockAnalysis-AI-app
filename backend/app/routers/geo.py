from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user, require_admin
from app.models.geo import GeoCurrentResponse, GeoImpactResponse, GeoRisk, GeoRiskDetailResponse, GeoEvent
from app.services import geo_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/geo", tags=["geo"])


@router.post("/collect")
def collect_geo(
    _admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """지정학 뉴스 수집 + AI 분석. (ADMIN 전용)"""
    result = geo_service.collect_and_analyze(client)
    return result


@router.get("/current", response_model=GeoCurrentResponse)
def current_risks(
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """현재 활성 지정학 리스크 목록."""
    result = client.table("geopolitical_risks").select("*").eq("status", "ACTIVE").order("risk_level", desc=True).execute()
    risks = [GeoRisk(**r) for r in (result.data or [])]
    return GeoCurrentResponse(risks=risks, total=len(risks))


@router.get("/{risk_id}", response_model=GeoRiskDetailResponse)
def risk_detail(
    risk_id: str,
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """개별 리스크 상세 + 이벤트 로그."""
    risk_result = client.table("geopolitical_risks").select("*").eq("risk_id", risk_id).single().execute()
    if not risk_result.data:
        raise HTTPException(status_code=404, detail="Risk not found")

    events_result = client.table("geopolitical_events").select("*").eq("risk_id", risk_id).order("created_at", desc=True).limit(20).execute()

    return GeoRiskDetailResponse(
        risk=GeoRisk(**risk_result.data),
        events=[GeoEvent(**e) for e in (events_result.data or [])],
    )


@router.get("/impact/{ticker}", response_model=GeoImpactResponse)
def ticker_impact(
    ticker: str,
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """종목별 지정학 노출도."""
    result = client.table("geopolitical_risks").select("*").eq("status", "ACTIVE").contains("affected_tickers", [ticker]).execute()
    risks = [GeoRisk(**r) for r in (result.data or [])]

    # 최고 리스크 수준 산출
    level_order = {"CRITICAL": 4, "HIGH": 3, "MODERATE": 2, "LOW": 1}
    max_level = max((level_order.get(r.risk_level, 0) for r in risks), default=0)
    reverse = {4: "CRITICAL", 3: "HIGH", 2: "MODERATE", 1: "LOW", 0: "LOW"}

    return GeoImpactResponse(
        ticker=ticker,
        risks=risks,
        overall_exposure=reverse[max_level],
    )
