"""알림 API 엔드포인트."""

from fastapi import APIRouter, Depends

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user, require_admin
from app.models.alert import AlertCheckResult, PriceAlertsListResponse, RiskAlertResult
from app.services import alert_service

router = APIRouter(prefix="/api/alert", tags=["alert"])


@router.get("/my", response_model=PriceAlertsListResponse)
async def get_my_alerts(
    user: CurrentUser = Depends(get_current_user),
):
    """사용자 가격 알림 목록을 반환한다."""
    client = get_supabase()
    return alert_service.get_user_alerts(client, user.user_id)


@router.post("/check", response_model=AlertCheckResult)
async def manual_price_alert_check(
    _admin: CurrentUser = Depends(require_admin),
):
    """가격 알림을 수동으로 체크한다. (ADMIN 전용)"""
    client = get_supabase()
    return alert_service.check_price_alerts(client)


@router.post("/risk-check", response_model=RiskAlertResult)
async def manual_risk_check(
    _admin: CurrentUser = Depends(require_admin),
):
    """리스크 조건을 수동으로 체크한다. (ADMIN 전용)"""
    client = get_supabase()
    return alert_service.check_risk_conditions(client)
