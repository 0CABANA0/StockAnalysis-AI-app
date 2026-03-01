"""알림 API 엔드포인트."""

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user, require_admin
from app.models.alert import (
    AlertCheckResult,
    DeleteResponse,
    PriceAlertCreateRequest,
    PriceAlertResponse,
    PriceAlertsListResponse,
    RiskAlertResult,
)
from app.services import alert_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/alert", tags=["alert"])


@router.post("/", response_model=PriceAlertResponse, status_code=201)
async def create_alert(
    req: PriceAlertCreateRequest,
    user: CurrentUser = Depends(get_current_user),
):
    """가격 알림을 생성한다."""
    logger.info("알림 생성: user=%s, ticker=%s", user.user_id, req.ticker)
    client = get_supabase()
    try:
        return alert_service.create_price_alert(client, user.user_id, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("알림 생성 실패 (user=%s): %s", user.user_id, e)
        raise HTTPException(
            status_code=500, detail="알림 생성 중 오류가 발생했습니다."
        )


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


@router.delete("/{alert_id}", response_model=DeleteResponse)
async def delete_alert(
    alert_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """가격 알림을 삭제한다. 본인 소유만 삭제 가능."""
    logger.info("알림 삭제: user=%s, alert_id=%s", user.user_id, alert_id)
    client = get_supabase()
    try:
        return alert_service.delete_price_alert(client, user.user_id, alert_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
