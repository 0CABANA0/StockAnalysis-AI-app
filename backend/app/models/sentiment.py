"""뉴스 감성 분석 Pydantic 모델."""

from datetime import datetime

from pydantic import BaseModel


class NewsArticle(BaseModel):
    """RSS 수집 단계 내부용 — 외부 API에는 노출하지 않음."""

    title: str
    link: str
    source: str
    published: str | None = None


class SentimentResult(BaseModel):
    """DB 스키마(sentiment_results)에 1:1 대응하는 플랫 모델."""

    id: str | None = None
    source_url: str | None = None
    source_title: str | None = None
    score: float  # -1.0 ~ 1.0
    direction: str  # BULLISH | BEARISH | NEUTRAL
    confidence: float | None = None  # 0 ~ 1.0
    event_type: str | None = None  # GEOPOLITICAL | ECONOMIC | CURRENCY | REGULATORY | NATURAL
    urgency: str = "LOW"  # LOW | MEDIUM | HIGH
    reasoning: str | None = None
    affected_sectors: list[str] | None = None
    affected_countries: list[str] | None = None
    short_term_impact: str | None = None
    medium_term_impact: str | None = None
    analyzed_at: datetime | None = None
    created_at: datetime | None = None


# --- API 응답 ---


class SentimentCollectResponse(BaseModel):
    success: bool
    articles_collected: int
    articles_analyzed: int
    collected_at: datetime


class SentimentResultsResponse(BaseModel):
    results: list[SentimentResult]
    total: int
    limit: int
    offset: int
