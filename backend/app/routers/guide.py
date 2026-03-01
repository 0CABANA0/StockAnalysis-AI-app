from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client
from datetime import date

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user, require_admin
from app.models.guide import InvestmentGuide, TickerGuideResponse, TodayGuideResponse, ActionCard, KeyEvent
from app.services import guide_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/guide", tags=["guide"])


@router.post("/generate")
def generate_guides(
    _admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """투자 가이드 생성 (스케줄러/ADMIN)."""
    result = guide_service.generate_daily_guide(client)
    return result


@router.post("/generate/{ticker}")
def generate_ticker_guide(
    ticker: str,
    _admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """종목별 투자 가이드 생성 (ADMIN 전용)."""
    result = guide_service.generate_ticker_guide(client, ticker.upper())
    return result


@router.get("/today", response_model=TodayGuideResponse)
def today_guide(
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """오늘의 액션 가이드."""
    today = date.today().isoformat()
    result = client.table("daily_briefings").select("*").eq("briefing_date", today).execute()

    if not result.data:
        return TodayGuideResponse(
            briefing_date=today,
            market_summary=None,
            geo_summary=None,
            action_cards=[],
            key_events=[],
        )

    data = result.data[0]
    return TodayGuideResponse(
        briefing_date=data["briefing_date"],
        market_summary=data.get("market_summary"),
        geo_summary=data.get("geo_summary"),
        action_cards=[ActionCard(**c) for c in (data.get("action_cards") or [])],
        key_events=[KeyEvent(**e) for e in (data.get("key_events") or [])],
    )


@router.get("/{ticker}", response_model=TickerGuideResponse)
def ticker_guide(
    ticker: str,
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """개별 종목 가이드."""
    today = date.today().isoformat()
    result = client.table("investment_guides").select("*").eq("ticker", ticker).eq("guide_date", today).execute()

    if not result.data:
        return TickerGuideResponse(guide=None)

    return TickerGuideResponse(guide=InvestmentGuide(**result.data[0]))
