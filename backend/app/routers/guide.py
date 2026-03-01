from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user, require_admin
from app.models.guide import (
    ActionCard,
    InvestmentGuide,
    KeyEvent,
    TickerGuideResponse,
    TodayGuideResponse,
    WeeklyReportDetail,
    WeeklyReportDetailResponse,
    WeeklyReportItem,
    WeeklyReportListResponse,
)
from app.services import guide_service, weekly_report_service
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


# ─── 주간 리포트 엔드포인트 (/{ticker}보다 먼저 매칭되도록 위에 배치) ───


@router.post("/weekly/generate")
def generate_weekly_report(
    week_start: str | None = Query(None, description="대상 주 월요일 (YYYY-MM-DD). 미지정 시 직전 주."),
    _admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """주간 리포트 생성 (ADMIN 전용)."""
    target = None
    if week_start:
        try:
            target = date.fromisoformat(week_start)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    result = weekly_report_service.generate_weekly_report(client, target)
    return result


@router.get("/weekly", response_model=WeeklyReportListResponse)
def list_weekly_reports(
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
    limit: int = Query(12, ge=1, le=52),
):
    """최근 주간 리포트 목록 조회."""
    reports = weekly_report_service.list_weekly_reports(client, limit)
    return WeeklyReportListResponse(
        reports=[WeeklyReportItem(**r) for r in reports],
    )


@router.get("/weekly/{week_start_date}", response_model=WeeklyReportDetailResponse)
def get_weekly_report(
    week_start_date: str,
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """특정 주간 리포트 상세 조회."""
    report = weekly_report_service.get_weekly_report(client, week_start_date)
    if not report:
        return WeeklyReportDetailResponse(report=None)
    return WeeklyReportDetailResponse(report=WeeklyReportDetail(**report))


# ─── 종목별 가이드 (맨 아래 배치 — path param 충돌 방지) ───


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
