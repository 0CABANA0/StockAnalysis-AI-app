from pydantic import BaseModel


class CausalChainStep(BaseModel):
    """인과관계 체인의 단일 단계.

    event → impact 흐름을 reasoning(근거 사유)과 logic(뒷받침 논리)으로 설명한다.
    """

    event: str  # 원인 이벤트 (예: "금값 상승 +5%")
    impact: str  # 결과 영향 (예: "달러 약세 → 원/달러 환율 하락")
    reasoning: str  # 근거 사유 (왜 이 연결이 발생하는가)
    affected_sectors: list[str] = []  # 영향받는 섹터/산업
    direction: str = ""  # POSITIVE, NEGATIVE, MIXED


class ActionCard(BaseModel):
    ticker: str
    company_name: str
    action: str  # BUY, SELL, HOLD, WATCH, AVOID
    reason: str


class KeyEvent(BaseModel):
    time: str
    title: str
    importance: str  # HIGH, MEDIUM, LOW


class InvestmentGuide(BaseModel):
    ticker: str
    guide_date: str
    action: str
    macro_reasoning: str | None = None
    geo_reasoning: str | None = None
    technical_reasoning: str | None = None
    causal_chain: list[CausalChainStep] = []  # 거시경제·지정학 인과관계 체인
    target_price: float | None = None
    stop_loss: float | None = None
    confidence: float | None = None
    risk_tags: list[str] = []
    fx_impact: str | None = None
    full_report_text: str | None = None


class TodayGuideResponse(BaseModel):
    briefing_date: str
    market_summary: str | None = None
    geo_summary: str | None = None
    market_causal_chain: list[CausalChainStep] = []  # 시장 전체 인과관계 체인
    action_cards: list[ActionCard]
    key_events: list[KeyEvent]


class TickerGuideResponse(BaseModel):
    guide: InvestmentGuide | None = None
