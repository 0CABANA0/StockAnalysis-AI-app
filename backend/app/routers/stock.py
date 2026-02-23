"""주식 데이터 API — 캔들, 기술적 지표, 현재가."""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.middleware.auth import CurrentUser, get_current_user
from app.models.stock import CandleResponse, IndicatorResponse, QuoteResponse, StockQuote
from app.services.stock_service import (
    fetch_candles,
    fetch_indicators,
    fetch_multiple_quotes,
    fetch_quote,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/stock", tags=["stock"])

VALID_PERIODS = {"1mo", "3mo", "6mo", "1y", "2y", "5y", "max"}
VALID_INTERVALS = {"1d", "1wk", "1mo"}


@router.get("/{ticker}/candles", response_model=CandleResponse)
def get_candles(
    ticker: str,
    period: str = Query(default="6mo", description="조회 기간"),
    interval: str = Query(default="1d", description="캔들 간격"),
    _user: CurrentUser = Depends(get_current_user),
):
    """OHLCV 캔들 데이터를 반환한다."""
    if period not in VALID_PERIODS:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 기간입니다. 가능: {', '.join(sorted(VALID_PERIODS))}",
        )
    if interval not in VALID_INTERVALS:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 간격입니다. 가능: {', '.join(sorted(VALID_INTERVALS))}",
        )

    try:
        result = fetch_candles(ticker, period=period, interval=interval)
    except Exception as e:
        logger.error("Candle fetch failed for %s: %s", ticker, e)
        raise HTTPException(
            status_code=500,
            detail=f"캔들 데이터 조회 실패: {e}",
        )

    if result.count == 0:
        raise HTTPException(
            status_code=404,
            detail=f"'{ticker}'에 대한 데이터를 찾을 수 없습니다.",
        )

    return result


@router.get("/{ticker}/indicators", response_model=IndicatorResponse)
def get_indicators(
    ticker: str,
    _user: CurrentUser = Depends(get_current_user),
):
    """기술적 지표(RSI, MACD, BB, SMA)를 반환한다."""
    try:
        return fetch_indicators(ticker)
    except Exception as e:
        logger.error("Indicator calc failed for %s: %s", ticker, e)
        raise HTTPException(
            status_code=500,
            detail=f"지표 계산 실패: {e}",
        )


@router.get("/{ticker}/quote", response_model=StockQuote)
def get_quote(
    ticker: str,
    _user: CurrentUser = Depends(get_current_user),
):
    """현재가, 변동률, 거래량을 반환한다."""
    try:
        return fetch_quote(ticker)
    except Exception as e:
        logger.error("Quote fetch failed for %s: %s", ticker, e)
        raise HTTPException(
            status_code=500,
            detail=f"현재가 조회 실패: {e}",
        )


@router.post("/quotes", response_model=QuoteResponse)
def get_multiple_quotes(
    tickers: list[str],
    _user: CurrentUser = Depends(get_current_user),
):
    """여러 종목의 현재가를 병렬 조회한다."""
    if not tickers:
        raise HTTPException(status_code=400, detail="종목 코드를 1개 이상 입력하세요.")
    if len(tickers) > 50:
        raise HTTPException(status_code=400, detail="최대 50개까지 조회 가능합니다.")

    try:
        return fetch_multiple_quotes(tickers)
    except Exception as e:
        logger.error("Multiple quote fetch failed: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"현재가 일괄 조회 실패: {e}",
        )
