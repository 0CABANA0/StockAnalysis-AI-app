from pydantic import BaseModel


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
    action_cards: list[ActionCard]
    key_events: list[KeyEvent]


class TickerGuideResponse(BaseModel):
    guide: InvestmentGuide | None = None
