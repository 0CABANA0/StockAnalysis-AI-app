from fastapi import APIRouter, Depends, Query
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user
from app.models.calendar import CalendarEvent, CalendarResponse
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/", response_model=CalendarResponse)
def get_events(
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    event_type: str | None = Query(default=None),
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """경제+지정학 이벤트 캘린더."""
    query = client.table("economic_calendar").select("*").order("event_date")
    if start_date:
        query = query.gte("event_date", start_date)
    if end_date:
        query = query.lte("event_date", end_date)
    if event_type:
        query = query.eq("event_type", event_type)

    result = query.execute()
    events = [CalendarEvent(**e) for e in (result.data or [])]
    return CalendarResponse(events=events, total=len(events))
