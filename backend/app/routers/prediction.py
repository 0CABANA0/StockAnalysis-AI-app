"""통합 스코어링 API — 분석 트리거 + 결과 조회."""

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user
from app.models.prediction import (
    PredictionAnalyzeRequest,
    PredictionAnalyzeResponse,
    PredictionScoreResponse,
    PredictionScoresListResponse,
)
from app.services import prediction_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/prediction", tags=["prediction"])


@router.post("/analyze", response_model=PredictionAnalyzeResponse)
def analyze(
    body: PredictionAnalyzeRequest,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """5개 시그널을 분석하고 AI 리포트를 생성한다."""
    ticker = body.ticker.strip().upper()
    logger.info(
        "Prediction analysis requested: %s by %s", ticker, user.user_id
    )

    try:
        result = prediction_service.analyze_ticker(
            client=client,
            ticker=ticker,
            user_id=user.user_id,
            company_name=body.company_name,
        )
    except Exception as e:
        logger.error("Prediction analysis failed for %s: %s", ticker, e)
        raise HTTPException(
            status_code=500,
            detail=f"분석 실패: {e}",
        )

    return result


# /scores를 /{ticker}/latest 앞에 정의 — FastAPI 경로 매칭 충돌 방지
@router.get("/scores", response_model=PredictionScoresListResponse)
def scores(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """사용자의 전체 예측 결과를 페이지네이션으로 조회한다."""
    results, total = prediction_service.get_user_predictions(
        client=client,
        user_id=user.user_id,
        limit=limit,
        offset=offset,
    )
    return PredictionScoresListResponse(
        results=results,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{ticker}/latest", response_model=PredictionScoreResponse
)
def latest(
    ticker: str,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """특정 종목의 최신 예측 결과를 반환한다."""
    decoded = ticker.strip().upper()
    result = prediction_service.get_latest_prediction(
        client=client,
        user_id=user.user_id,
        ticker=decoded,
    )
    if result is None:
        raise HTTPException(
            status_code=404,
            detail=f"'{decoded}'에 대한 분석 결과가 없습니다.",
        )
    return result
