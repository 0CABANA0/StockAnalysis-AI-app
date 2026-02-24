from pydantic import BaseModel


class GeoRisk(BaseModel):
    risk_id: str
    title: str
    description: str | None = None
    risk_level: str  # LOW, MODERATE, HIGH, CRITICAL
    category: str
    affected_tickers: list[str] = []
    affected_sectors: list[str] = []
    affected_etfs: list[str] = []
    status: str  # ACTIVE, RESOLVED, DORMANT


class GeoEvent(BaseModel):
    risk_id: str
    event_title: str
    event_description: str | None = None
    source_url: str | None = None
    impact_assessment: str | None = None
    severity_change: str | None = None


class GeoCurrentResponse(BaseModel):
    risks: list[GeoRisk]
    total: int


class GeoRiskDetailResponse(BaseModel):
    risk: GeoRisk
    events: list[GeoEvent]


class GeoImpactResponse(BaseModel):
    ticker: str
    risks: list[GeoRisk]
    overall_exposure: str  # LOW, MODERATE, HIGH, CRITICAL
