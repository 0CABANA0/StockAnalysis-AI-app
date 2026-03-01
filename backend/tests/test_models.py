"""Pydantic 모델 직렬화/역직렬화 테스트."""

from app.models.macro import (
    Commodities,
    EcosIndicators,
    ExchangeRates,
    FredIndicators,
    GlobalIndices,
    RatesAndFear,
    SnapshotData,
)
from app.models.watchlist import WatchlistAddRequest, WatchlistItem


# ---------------------------------------------------------------------------
# SnapshotData
# ---------------------------------------------------------------------------


def test_snapshot_data_defaults():
    """SnapshotData 기본값이 모두 None."""
    s = SnapshotData()
    assert s.exchange_rates.usd_krw is None
    assert s.commodities.wti is None
    assert s.rates_and_fear.vix is None
    assert s.global_indices.sp500 is None
    assert s.fred.fed_funds_rate is None
    assert s.ecos.bok_base_rate is None


def test_snapshot_data_round_trip():
    """model_dump → 재생성 시 값이 보존된다."""
    s = SnapshotData(
        exchange_rates=ExchangeRates(usd_krw=1380.5),
        commodities=Commodities(gold=2650.0),
        rates_and_fear=RatesAndFear(vix=18.5),
        global_indices=GlobalIndices(kospi=2600.0),
        fred=FredIndicators(fed_funds_rate=4.33, treasury_spread=-0.25),
        ecos=EcosIndicators(bok_base_rate=3.5),
    )
    data = s.model_dump()
    restored = SnapshotData(**data)
    assert restored.exchange_rates.usd_krw == 1380.5
    assert restored.commodities.gold == 2650.0
    assert restored.rates_and_fear.vix == 18.5
    assert restored.global_indices.kospi == 2600.0
    assert restored.fred.fed_funds_rate == 4.33
    assert restored.fred.treasury_spread == -0.25
    assert restored.ecos.bok_base_rate == 3.5


# ---------------------------------------------------------------------------
# WatchlistItem
# ---------------------------------------------------------------------------


def test_watchlist_item_default_asset_type():
    """WatchlistItem의 기본 asset_type은 STOCK."""
    item = WatchlistItem(
        id="wl-1",
        ticker="AAPL",
        company_name="Apple",
        market="US",
        added_at="2026-01-01",
    )
    assert item.asset_type == "STOCK"


def test_watchlist_add_request_validation():
    """WatchlistAddRequest 필수 필드 검증."""
    req = WatchlistAddRequest(
        ticker="005930",
        company_name="삼성전자",
        market="KR",
    )
    assert req.ticker == "005930"
    assert req.asset_type == "STOCK"
