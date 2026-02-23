"""통합 스코어링(prediction_scores) Pydantic 모델."""

from datetime import datetime

from pydantic import BaseModel


# ─── 요청 ───


class PredictionAnalyzeRequest(BaseModel):
    ticker: str
    company_name: str | None = None


# ─── 시그널 분해 (디버그 + AI 프롬프트용) ───


class TechnicalSignal(BaseModel):
    rsi_score: float = 0.0
    macd_score: float = 0.0
    bb_score: float = 0.0
    composite: float = 0.0


class MacroSignal(BaseModel):
    vix_score: float = 0.0
    yield_score: float = 0.0
    index_score: float = 0.0
    composite: float = 0.0


class SentimentSignal(BaseModel):
    avg_weighted_score: float = 0.0
    article_count: int = 0
    composite: float = 0.0


class CurrencySignal(BaseModel):
    usd_krw: float | None = None
    usd_krw_direction: str = "NEUTRAL"
    composite: float = 0.0


class GeopoliticalSignal(BaseModel):
    high_urgency_count: int = 0
    avg_geopolitical_score: float = 0.0
    composite: float = 0.0


class SignalBreakdown(BaseModel):
    technical: TechnicalSignal = TechnicalSignal()
    macro: MacroSignal = MacroSignal()
    sentiment: SentimentSignal = SentimentSignal()
    currency: CurrencySignal = CurrencySignal()
    geopolitical: GeopoliticalSignal = GeopoliticalSignal()


# ─── DB row 1:1 대응 응답 ───


class PredictionScoreResponse(BaseModel):
    id: str
    user_id: str
    ticker: str
    company_name: str | None = None
    technical_score: float | None = None
    macro_score: float | None = None
    sentiment_score: float | None = None
    currency_score: float | None = None
    geopolitical_score: float | None = None
    short_term_score: float
    medium_term_score: float | None = None
    direction: str  # STRONG_BUY | BUY | HOLD | SELL | STRONG_SELL
    risk_level: str  # LOW | MEDIUM | HIGH
    opinion: str | None = None
    report_text: str | None = None
    scenario_bull: dict | None = None
    scenario_base: dict | None = None
    scenario_bear: dict | None = None
    analyzed_at: datetime
    created_at: datetime


# ─── API 응답 래퍼 ───


class PredictionAnalyzeResponse(BaseModel):
    success: bool
    ticker: str
    score: PredictionScoreResponse
    signal_breakdown: SignalBreakdown


class PredictionScoresListResponse(BaseModel):
    results: list[PredictionScoreResponse]
    total: int
    limit: int
    offset: int
