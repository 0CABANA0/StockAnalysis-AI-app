"""FRED(Federal Reserve Economic Data) 경제 지표 수집 서비스.

fredapi 패키지를 사용하여 미국 핵심 경제 지표를 수집한다.
API 키가 없으면 빈 FredIndicators를 반환하여 기존 수집 흐름을 깨뜨리지 않는다.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app.config import settings
from app.models.macro import FredIndicators
from app.utils.logger import get_logger

logger = get_logger(__name__)

# FRED 시리즈 ID → 필드명 매핑
FRED_SERIES: dict[str, str] = {
    "DFF": "fed_funds_rate",  # Federal Funds Effective Rate
    "T10Y2Y": "treasury_spread",  # 10Y-2Y Treasury Spread
    "T10YIE": "breakeven_inflation",  # 10Y Breakeven Inflation
    "UNRATE": "unemployment_rate",  # Unemployment Rate
    "BAMLH0A0HYM2": "high_yield_spread",  # High Yield Spread
}


def collect_fred_data() -> FredIndicators:
    """FRED에서 5개 경제 지표를 수집한다.

    API 키가 없으면 빈 FredIndicators를 반환한다.
    개별 시리즈 실패 시 해당 필드만 None으로 남긴다.
    """
    if not settings.fred_api_key:
        logger.info("FRED API key not configured — skipping FRED collection")
        return FredIndicators()

    try:
        from fredapi import Fred  # noqa: PLC0415 — 조건부 임포트

        fred = Fred(api_key=settings.fred_api_key)
    except Exception as e:
        logger.error("FRED client initialization failed: %s", e)
        return FredIndicators()

    # 최근 90일 범위에서 최신값 조회
    end_date = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=90)

    results: dict[str, float | None] = {}

    for series_id, field_name in FRED_SERIES.items():
        try:
            series = fred.get_series(
                series_id,
                observation_start=start_date,
                observation_end=end_date,
            )
            if series is not None and not series.empty:
                # NaN 제거 후 최신값
                valid = series.dropna()
                if not valid.empty:
                    value = round(float(valid.iloc[-1]), 4)
                    results[field_name] = value
                    logger.info("  FRED %s (%s) = %s", series_id, field_name, value)
                else:
                    results[field_name] = None
                    logger.warning("  FRED %s — all values NaN", series_id)
            else:
                results[field_name] = None
                logger.warning("  FRED %s — empty series", series_id)
        except Exception as e:
            results[field_name] = None
            logger.warning("  FRED %s failed: %s", series_id, e)

    indicators = FredIndicators(**results)
    success_count = sum(1 for v in results.values() if v is not None)
    logger.info(
        "FRED collection done — %d/%d succeeded",
        success_count,
        len(FRED_SERIES),
    )
    return indicators
