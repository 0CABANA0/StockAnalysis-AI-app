"""뉴스 감성 분석 API — 수집/분석 트리거 + 결과 조회 + 카테고리."""

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user, require_admin
from app.models.sentiment import (
    NewsCategoriesResponse,
    SentimentCollectResponse,
    SentimentResultsResponse,
)
from app.services.sentiment_service import (
    collect_and_analyze,
    get_categories,
    get_category_summary,
    get_results,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/sentiment", tags=["sentiment"])


@router.post("/collect", response_model=SentimentCollectResponse)
def collect(
    _admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """뉴스 수집 + AI 감성 분석을 트리거한다. (ADMIN 전용)"""
    logger.info("Manual sentiment collection triggered")

    try:
        result = collect_and_analyze(client)
    except Exception as e:
        logger.error("Sentiment collection failed: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"감성 분석 실패: {e}",
        )

    return result


@router.get("/results", response_model=SentimentResultsResponse)
def results(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    news_category: str | None = Query(default=None, description="카테고리 필터"),
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """감성 분석 결과를 페이지네이션으로 조회한다. news_category로 필터 가능."""
    sentiment_results, total = get_results(
        client, limit=limit, offset=offset, news_category=news_category,
    )
    return SentimentResultsResponse(
        results=sentiment_results,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/categories", response_model=NewsCategoriesResponse)
def categories(
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """뉴스 카테고리 설정 목록을 반환한다."""
    cats = get_categories(client)
    return NewsCategoriesResponse(categories=cats)


@router.get("/categories/summary")
def category_summary(
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """카테고리별 최근 분석 요약 통계를 반환한다."""
    return {"summaries": get_category_summary(client)}
