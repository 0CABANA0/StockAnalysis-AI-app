"""한국은행 ECOS(경제통계시스템) 경제 지표 수집 서비스.

ECOS Open API를 통해 한국 핵심 경제 지표를 수집한다.
API 키가 없으면 빈 EcosIndicators를 반환한다.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import httpx

from app.config import settings
from app.models.macro import EcosIndicators
from app.utils.logger import get_logger

logger = get_logger(__name__)

ECOS_BASE_URL = "https://ecos.bok.or.kr/api/StatisticSearch"
ECOS_TIMEOUT = 10  # 초

# (stat_code, item_code, cycle, field_name, description)
ECOS_SERIES: list[tuple[str, str, str, str, str]] = [
    ("722Y001", "0101000", "D", "bok_base_rate", "한국 기준금리"),
    ("817Y002", "010200000", "D", "korea_treasury_3y", "국고채 3년"),
    ("901Y009", "0", "M", "korea_cpi_yoy", "소비자물가 전년동월비"),
]


def _fetch_ecos_value(
    api_key: str,
    stat_code: str,
    item_code: str,
    cycle: str,
) -> float | None:
    """ECOS API에서 단일 통계값을 가져온다.

    API URL 형식:
    /StatisticSearch/{api_key}/json/kr/1/1/{stat_code}/{cycle}/{start}/{end}/{item_code}
    """
    now = datetime.now(timezone.utc)

    if cycle == "D":
        # 일별: 최근 30일
        start_date = (now - timedelta(days=30)).strftime("%Y%m%d")
        end_date = now.strftime("%Y%m%d")
    else:
        # 월별: 최근 6개월
        start_date = (now - timedelta(days=180)).strftime("%Y%m")
        end_date = now.strftime("%Y%m")

    url = (
        f"{ECOS_BASE_URL}/{api_key}/json/kr/1/5"
        f"/{stat_code}/{cycle}/{start_date}/{end_date}/{item_code}"
    )

    try:
        response = httpx.get(url, timeout=ECOS_TIMEOUT)
        response.raise_for_status()
        data = response.json()

        # ECOS 응답 구조: {"StatisticSearch": {"row": [...]}}
        stat_search = data.get("StatisticSearch")
        if not stat_search:
            # 에러 응답: {"RESULT": {"CODE": "...", "MESSAGE": "..."}}
            err = data.get("RESULT", {})
            logger.warning(
                "ECOS %s error: %s — %s",
                stat_code,
                err.get("CODE", "UNKNOWN"),
                err.get("MESSAGE", ""),
            )
            return None

        rows = stat_search.get("row", [])
        if not rows:
            return None

        # 최신 데이터 (마지막 row)
        latest = rows[-1]
        value_str = latest.get("DATA_VALUE", "")
        if value_str and value_str != "-":
            return round(float(value_str), 4)

    except httpx.TimeoutException:
        logger.warning("ECOS %s — timeout", stat_code)
    except (httpx.HTTPError, ValueError, KeyError) as e:
        logger.warning("ECOS %s failed: %s", stat_code, e)

    return None


def collect_ecos_data() -> EcosIndicators:
    """ECOS에서 3개 경제 지표를 수집한다.

    API 키가 없으면 빈 EcosIndicators를 반환한다.
    개별 지표 실패 시 해당 필드만 None으로 남긴다.
    """
    if not settings.ecos_api_key:
        logger.info("ECOS API key not configured — skipping ECOS collection")
        return EcosIndicators()

    results: dict[str, float | None] = {}

    for stat_code, item_code, cycle, field_name, description in ECOS_SERIES:
        value = _fetch_ecos_value(
            api_key=settings.ecos_api_key,
            stat_code=stat_code,
            item_code=item_code,
            cycle=cycle,
        )
        results[field_name] = value
        if value is not None:
            logger.info("  ECOS %s (%s) = %s", description, field_name, value)
        else:
            logger.warning("  ECOS %s — no data", description)

    indicators = EcosIndicators(**results)
    success_count = sum(1 for v in results.values() if v is not None)
    logger.info(
        "ECOS collection done — %d/%d succeeded",
        success_count,
        len(ECOS_SERIES),
    )
    return indicators
