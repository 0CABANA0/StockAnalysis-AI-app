"""이미지 분석(모듈 G) Pydantic 모델."""

from pydantic import BaseModel, Field


# ─── OCR 추출 종목 ───


class RecognizedHolding(BaseModel):
    ticker: str | None = None
    name: str
    quantity: float | None = None
    avg_price: float | None = None
    current_price: float | None = None
    profit_loss_rate: float | None = None
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    verified: bool = False


# ─── 투자 가이드 하위 모델 ───


class SectorAnalysis(BaseModel):
    name: str
    weight_pct: float
    assessment: str


class HoldingRecommendation(BaseModel):
    ticker: str | None = None
    name: str
    opinion: str  # STRONG_BUY | BUY | HOLD | SELL | STRONG_SELL
    rationale: str
    target_price: float | None = None
    stop_loss: float | None = None


class ActionPlan(BaseModel):
    this_week: list[str] = []
    this_month: list[str] = []
    three_months: list[str] = []


class InvestmentGuide(BaseModel):
    diagnosis: str
    sector_analysis: list[SectorAnalysis] = []
    recommendations: list[HoldingRecommendation] = []
    risk_level: str = "MEDIUM"  # LOW | MEDIUM | HIGH
    action_plan: ActionPlan = ActionPlan()


# ─── API 요청/응답 ───


class ImageAnalysisRequest(BaseModel):
    image_data: str = Field(..., description="Base64 인코딩된 이미지 데이터")
    media_type: str = Field(
        default="image/png",
        description="이미지 MIME 타입 (image/jpeg, image/png, image/webp)",
    )
    auto_register_alerts: bool = Field(
        default=False,
        description="True이면 AI 추천의 목표가/손절가로 가격 알림을 자동 등록한다",
    )
    auto_register_watchlist: bool = Field(
        default=False,
        description="True이면 OCR로 추출된 종목을 관심종목에 자동 등록한다",
    )


class ImageAnalysisResponse(BaseModel):
    holdings: list[RecognizedHolding]
    investment_guide: InvestmentGuide | None = None
    validation_status: str  # SUCCESS | PARTIAL | FAILED
    processing_time_ms: int
    auto_alerts_created: int = 0
    auto_watchlist_added: int = 0
