"""뉴스 감성 분석 Pydantic 모델."""

from datetime import datetime

from pydantic import BaseModel


class NewsArticle(BaseModel):
    title: str
    link: str
    source: str
    published: str | None = None


class SentimentScore(BaseModel):
    label: str  # "positive", "negative", "neutral"
    score: float  # -1.0 ~ 1.0
    summary: str  # 한글 한 줄 요약


class SentimentResult(BaseModel):
    id: str | None = None
    article: NewsArticle
    sentiment: SentimentScore
    model_used: str = ""
    analyzed_at: datetime | None = None
    created_at: datetime | None = None


# --- API 응답 ---


class SentimentCollectResponse(BaseModel):
    success: bool
    collected_count: int
    analyzed_count: int
    failed_count: int
    model_used: str
    collected_at: datetime


class SentimentResultsResponse(BaseModel):
    results: list[SentimentResult]
    total: int
    limit: int
    offset: int
