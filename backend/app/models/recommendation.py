"""추천 엔진(recommendations) Pydantic 모델."""

from datetime import datetime

from pydantic import BaseModel, Field


# ─── 요청 ───


class ScreenRequest(BaseModel):
    tickers: list[str]
    threshold: int = Field(default=60, ge=0, le=100)


# ─── 스크리닝 상세 ───


class ScreeningDetail(BaseModel):
    ticker: str
    name: str = ""
    rsi: float | None = None
    macd_signal: str = ""
    bb_signal: str = ""
    per: float | None = None
    sma_signal: str = ""
    composite_score: int = 0
    passed: bool = False


# ─── DB row 1:1 대응 응답 ───


class RecommendationResponse(BaseModel):
    id: str
    ticker: str
    company_name: str | None = None
    market: str | None = None
    reason: str | None = None
    target_price: float | None = None
    stop_loss: float | None = None
    confidence_score: float | None = None
    strategy: str | None = None
    expires_at: datetime | None = None
    is_active: bool = True
    created_at: datetime


# ─── API 응답 래퍼 ───


class ScreenResponse(BaseModel):
    screened: list[ScreeningDetail]
    recommendations_created: int
    total_screened: int


class RecommendationListResponse(BaseModel):
    recommendations: list[RecommendationResponse]
    total: int
