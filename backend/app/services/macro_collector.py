"""yfinance 기반 거시경제 데이터 병렬 수집 서비스."""

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

import yfinance as yf

from app.models.macro import (
    Commodities,
    ExchangeRates,
    GlobalIndices,
    RatesAndFear,
    SnapshotData,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

# 15개 수집 대상 티커
TICKERS: dict[str, str] = {
    # 환율
    "KRW=X": "usd_krw",
    "JPY=X": "jpy_usd",
    "EURUSD=X": "eur_usd",
    "CNYKRW=X": "cny_krw",
    # 원자재
    "CL=F": "wti",
    "GC=F": "gold",
    "HG=F": "copper",
    "NG=F": "natural_gas",
    # 금리 / VIX
    "^TNX": "us_10y_yield",
    "^VIX": "vix",
    # 글로벌 지수
    "^GSPC": "sp500",
    "^IXIC": "nasdaq",
    "^KS11": "kospi",
    "^N225": "nikkei",
    "000001.SS": "shanghai",
}

MAX_WORKERS = 8


def _fetch_price(ticker: str) -> float | None:
    """단일 티커의 최신 가격을 가져온다.

    fast_info["lastPrice"]를 우선 시도하고, 실패 시 history fallback.
    """
    try:
        t = yf.Ticker(ticker)

        # 1차: fast_info
        try:
            price = t.fast_info["lastPrice"]
            if price and price > 0:
                return round(float(price), 4)
        except (KeyError, TypeError, AttributeError):
            pass

        # 2차: history fallback
        hist = t.history(period="1d")
        if not hist.empty:
            return round(float(hist["Close"].iloc[-1]), 4)

    except Exception as e:
        logger.warning("Failed to fetch %s: %s", ticker, e)

    return None


def collect_macro_data() -> tuple[SnapshotData, list[str], datetime]:
    """15개 티커를 병렬 수집하여 SnapshotData를 반환한다.

    Returns:
        (snapshot_data, failed_tickers, collected_at)
    """
    collected_at = datetime.now(timezone.utc)
    results: dict[str, float | None] = {}
    failed: list[str] = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_to_ticker = {
            executor.submit(_fetch_price, ticker): ticker
            for ticker in TICKERS
        }

        for future in as_completed(future_to_ticker):
            ticker = future_to_ticker[future]
            field = TICKERS[ticker]
            try:
                price = future.result()
                results[field] = price
                if price is None:
                    failed.append(ticker)
                else:
                    logger.info("  %s (%s) = %s", ticker, field, price)
            except Exception as e:
                logger.error("  %s (%s) error: %s", ticker, field, e)
                results[field] = None
                failed.append(ticker)

    snapshot = SnapshotData(
        exchange_rates=ExchangeRates(
            usd_krw=results.get("usd_krw"),
            jpy_usd=results.get("jpy_usd"),
            eur_usd=results.get("eur_usd"),
            cny_krw=results.get("cny_krw"),
        ),
        commodities=Commodities(
            wti=results.get("wti"),
            gold=results.get("gold"),
            copper=results.get("copper"),
            natural_gas=results.get("natural_gas"),
        ),
        rates_and_fear=RatesAndFear(
            us_10y_yield=results.get("us_10y_yield"),
            vix=results.get("vix"),
        ),
        global_indices=GlobalIndices(
            sp500=results.get("sp500"),
            nasdaq=results.get("nasdaq"),
            kospi=results.get("kospi"),
            nikkei=results.get("nikkei"),
            shanghai=results.get("shanghai"),
        ),
    )

    logger.info(
        "Macro collection done — %d/%d succeeded",
        len(TICKERS) - len(failed),
        len(TICKERS),
    )
    return snapshot, failed, collected_at
