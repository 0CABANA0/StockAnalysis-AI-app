from pydantic import BaseModel


class CalendarEvent(BaseModel):
    event_date: str
    event_title: str
    event_type: str  # ECONOMIC, GEOPOLITICAL, EARNINGS
    country: str | None = None
    importance: str  # HIGH, MEDIUM, LOW
    affected_assets: list[str] = []
    expected_impact: str | None = None
    actual_result: str | None = None


class CalendarResponse(BaseModel):
    events: list[CalendarEvent]
    total: int
