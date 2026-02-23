"""ETF/펀드 + 성과 분석 Pydantic 모델."""

from datetime import datetime

from pydantic import BaseModel, Field


# --- ETF/펀드 마스터 ---


class EtfFundMasterResponse(BaseModel):
    """DB etf_fund_master 1:1 대응."""

    id: str
    ticker: str
    name: str = ""
    asset_type: str = ""  # ETF_KR, ETF_US, FUND
    category: str = ""
    nav: float | None = None
    ter: float | None = None  # Total Expense Ratio (%)
    aum: float | None = None  # Assets Under Management
    currency: str = "KRW"
    description: str = ""
    created_at: datetime | None = None
    updated_at: datetime | None = None


class EtfMacroMappingResponse(BaseModel):
    """DB etf_macro_mapping 1:1 대응."""

    id: str
    scenario: str
    tickers: list[str] = []
    rationale: str = ""
    created_at: datetime | None = None


class EtfSyncResponse(BaseModel):
    """동기화 결과."""

    domestic_count: int = 0
    foreign_count: int = 0
    fund_count: int = 0
    total_count: int = 0
    failed_tickers: list[str] = []
    synced_at: datetime


class EtfListResponse(BaseModel):
    """페이지네이션 목록."""

    items: list[EtfFundMasterResponse]
    total: int
    limit: int
    offset: int


# --- 거시-ETF 추천 ---


class MacroEtfSuggestion(BaseModel):
    """단일 추천 항목."""

    scenario: str
    tickers: list[str] = []
    rationale: str = ""
    relevance_score: float = 0.0


class MacroEtfSuggestionsResponse(BaseModel):
    """추천 목록 + 현재 거시 컨텍스트."""

    suggestions: list[MacroEtfSuggestion]
    macro_context: dict = {}  # VIX, USD/KRW, WTI 등 현재 값
    generated_at: datetime


# --- 성과 분석 ---


class PerformanceMetrics(BaseModel):
    """단일 티커 성과."""

    ticker: str
    name: str = ""
    sharpe_ratio: float | None = None
    mdd: float | None = None  # Max Drawdown (%)
    annualized_return: float | None = None  # (%)
    volatility: float | None = None  # (%)
    total_return: float | None = None  # (%)
    data_points: int = 0


class RollingReturn(BaseModel):
    """롤링 수익률."""

    ticker: str
    window: str  # 1M, 3M, 6M, 12M
    value: float | None = None  # (%)


class CorrelationPair(BaseModel):
    """티커 쌍별 상관계수."""

    ticker_a: str
    ticker_b: str
    correlation: float


class PerformanceAnalysisRequest(BaseModel):
    """분석 요청."""

    tickers: list[str] = Field(..., min_length=1, max_length=20)
    period: str = Field(default="1y", pattern=r"^(6mo|1y|2y|5y)$")
    risk_free_rate: float = Field(default=0.035, ge=0.0, le=0.2)


class PerformanceAnalysisResponse(BaseModel):
    """종합 응답."""

    metrics: list[PerformanceMetrics]
    rolling_returns: list[RollingReturn]
    correlations: list[CorrelationPair]
    period: str
    analyzed_at: datetime
