"""추천 엔진 API — 스크리닝 실행 + 활성 추천 조회."""

from fastapi import APIRouter, Depends, Query
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user, require_admin
from app.models.recommendation import (
    RecommendationListResponse,
    ScreenRequest,
    ScreenResponse,
)
from app.services import recommendation_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/recommendation", tags=["recommendation"])


@router.post("/screen", response_model=ScreenResponse)
def screen(
    body: ScreenRequest,
    _admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """티커 목록을 스크리닝하고 추천을 생성한다 (ADMIN 이상)."""
    tickers = [t.strip().upper() for t in body.tickers if t.strip()]
    logger.info(
        "Screening requested: %d tickers, threshold=%d by %s",
        len(tickers),
        body.threshold,
        _admin.user_id,
    )

    result = recommendation_service.screen_tickers(
        tickers=tickers,
        threshold=body.threshold,
        client=client,
    )

    logger.info(
        "Screening complete: %d screened, %d recommendations created",
        result.total_screened,
        result.recommendations_created,
    )
    return result


@router.get("/active", response_model=RecommendationListResponse)
def active(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """활성 추천 목록을 조회한다 (USER 이상)."""
    recommendations, total = recommendation_service.get_active_recommendations(
        client=client,
        limit=limit,
        offset=offset,
    )
    return RecommendationListResponse(
        recommendations=recommendations,
        total=total,
    )
