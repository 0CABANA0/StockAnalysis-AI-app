"""공포/탐욕 지수 계산 서비스.

기존 macro_snapshots + sentiment_results 데이터를 활용하여
0~100 공포/탐욕 지수를 계산한다.
"""

from datetime import datetime, timezone

from supabase import Client

from app.services.supabase_client import get_latest
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _label_from_value(value: int) -> str:
    """0~100 지수값을 라벨로 변환한다."""
    if value <= 20:
        return "EXTREME_FEAR"
    if value <= 40:
        return "FEAR"
    if value <= 60:
        return "NEUTRAL"
    if value <= 80:
        return "GREED"
    return "EXTREME_GREED"


def _component_label(value: float) -> str:
    """개별 컴포넌트값을 라벨로 변환한다."""
    return _label_from_value(int(value))


# ─── 4개 컴포넌트 ───


def _calc_vix_component(vix: float | None) -> dict:
    """VIX 기반 공포 컴포넌트. VIX 높을수록 공포(낮은 값)."""
    if vix is None:
        return {"value": 50, "label": "NEUTRAL", "raw": None}

    # VIX 10 → 100(극탐), VIX 40 → 0(극공), 선형
    value = max(0.0, min(100.0, 100 - (vix - 10) * (100 / 30)))
    return {
        "value": round(value),
        "label": _component_label(value),
        "raw": round(vix, 2),
    }


def _calc_momentum_component(client: Client) -> dict:
    """S&P500 모멘텀 기반 컴포넌트.

    최근 스냅샷의 S&P500 대비 이전 스냅샷 비교로 추세 판단.
    """
    try:
        result = (
            client.table("macro_snapshots")
            .select("snapshot_data")
            .order("collected_at", desc=True)
            .limit(5)
            .execute()
        )
        rows = result.data or []
    except Exception as e:
        logger.warning("Momentum data fetch failed: %s", e)
        return {"value": 50, "label": "NEUTRAL", "raw": None}

    if len(rows) < 2:
        return {"value": 50, "label": "NEUTRAL", "raw": None}

    def _get_sp500(snapshot_data: dict) -> float | None:
        indices = snapshot_data.get("indices", {})
        return indices.get("sp500")

    latest = _get_sp500(rows[0].get("snapshot_data", {}))
    oldest = _get_sp500(rows[-1].get("snapshot_data", {}))

    if latest is None or oldest is None or oldest == 0:
        return {"value": 50, "label": "NEUTRAL", "raw": None}

    # 변화율 기반: +5% → 100, -5% → 0, 선형
    pct_change = ((latest - oldest) / oldest) * 100
    value = max(0.0, min(100.0, 50 + pct_change * 10))

    return {
        "value": round(value),
        "label": _component_label(value),
        "raw": round(pct_change, 2),
    }


def _calc_sentiment_component(client: Client) -> dict:
    """뉴스 감성 기반 컴포넌트. BULLISH 비율 → 탐욕."""
    try:
        result = (
            client.table("sentiment_results")
            .select("direction")
            .order("analyzed_at", desc=True)
            .limit(50)
            .execute()
        )
        rows = result.data or []
    except Exception as e:
        logger.warning("Sentiment data fetch failed: %s", e)
        return {"value": 50, "label": "NEUTRAL", "raw": None}

    if not rows:
        return {"value": 50, "label": "NEUTRAL", "raw": None}

    bullish = sum(1 for r in rows if r.get("direction") == "BULLISH")
    bearish = sum(1 for r in rows if r.get("direction") == "BEARISH")
    total = len(rows)

    # BULLISH 비율: 100% → 100, 0% → 0
    bull_ratio = bullish / total * 100
    bear_ratio = bearish / total * 100
    value = max(0.0, min(100.0, bull_ratio + (50 - bear_ratio) * 0.5))

    return {
        "value": round(value),
        "label": _component_label(value),
        "raw": {"bullish_pct": round(bull_ratio, 1), "bearish_pct": round(bear_ratio, 1)},
    }


def _calc_safe_haven_component(client: Client) -> dict:
    """금 가격 추세 기반 컴포넌트. 금 상승 → 공포(낮은 값)."""
    try:
        result = (
            client.table("macro_snapshots")
            .select("gold")
            .order("collected_at", desc=True)
            .limit(5)
            .execute()
        )
        rows = result.data or []
    except Exception as e:
        logger.warning("Gold data fetch failed: %s", e)
        return {"value": 50, "label": "NEUTRAL", "raw": None}

    if len(rows) < 2:
        return {"value": 50, "label": "NEUTRAL", "raw": None}

    latest_gold = rows[0].get("gold")
    oldest_gold = rows[-1].get("gold")

    if latest_gold is None or oldest_gold is None or oldest_gold == 0:
        return {"value": 50, "label": "NEUTRAL", "raw": None}

    # 금 상승 → 공포 → 낮은 값
    pct_change = ((latest_gold - oldest_gold) / oldest_gold) * 100
    # 금 +3% → 20(공포), 금 -3% → 80(탐욕)
    value = max(0.0, min(100.0, 50 - pct_change * 10))

    return {
        "value": round(value),
        "label": _component_label(value),
        "raw": round(pct_change, 2),
    }


# ─── 통합 계산 ───


def collect_fear_greed(client: Client) -> dict:
    """4개 컴포넌트 균등가중평균으로 공포/탐욕 지수를 계산하고 DB에 저장한다."""
    snapshot = get_latest(client)
    vix = snapshot.vix if snapshot else None

    # 4개 컴포넌트 계산
    vix_comp = _calc_vix_component(vix)
    momentum_comp = _calc_momentum_component(client)
    sentiment_comp = _calc_sentiment_component(client)
    safe_haven_comp = _calc_safe_haven_component(client)

    components = {
        "vix": vix_comp,
        "momentum": momentum_comp,
        "sentiment": sentiment_comp,
        "safe_haven": safe_haven_comp,
    }

    # 균등가중평균
    values = [c["value"] for c in components.values()]
    index_value = round(sum(values) / len(values))
    label = _label_from_value(index_value)

    snapshot_at = datetime.now(timezone.utc).isoformat()

    # DB 저장
    row = {
        "index_value": index_value,
        "label": label,
        "components": components,
        "snapshot_at": snapshot_at,
    }

    try:
        client.table("fear_greed_snapshots").insert(row).execute()
        logger.info(
            "Fear & Greed index saved: %d (%s)",
            index_value,
            label,
        )
    except Exception as e:
        logger.error("Failed to save fear/greed snapshot: %s", e)

    return {
        "success": True,
        "index_value": index_value,
        "label": label,
        "components": components,
    }
