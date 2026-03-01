"""거시경제 데이터 수집 서비스 단위 테스트."""

from unittest.mock import MagicMock, patch

from app.models.macro import SnapshotData
from app.services.macro_collector import TICKERS, collect_macro_data


def test_tickers_count():
    """수집 대상 티커가 15개인지 확인한다."""
    assert len(TICKERS) == 15


def test_tickers_have_all_categories():
    """환율, 원자재, 금리, 글로벌 지수 필드가 모두 포함된다."""
    fields = set(TICKERS.values())
    # 환율
    assert "usd_krw" in fields
    assert "jpy_usd" in fields
    # 원자재
    assert "wti" in fields
    assert "gold" in fields
    # 금리/VIX
    assert "vix" in fields
    assert "us_10y_yield" in fields
    # 글로벌 지수
    assert "sp500" in fields
    assert "kospi" in fields


@patch("app.services.macro_collector._fetch_price")
def test_collect_macro_data_all_success(mock_fetch):
    """모든 티커 수집 성공 시 failed_tickers가 비어있다."""
    mock_fetch.return_value = 100.0

    snapshot, failed, collected_at = collect_macro_data()

    assert isinstance(snapshot, SnapshotData)
    assert failed == []
    assert snapshot.exchange_rates.usd_krw == 100.0
    assert snapshot.commodities.wti == 100.0
    assert snapshot.rates_and_fear.vix == 100.0
    assert snapshot.global_indices.sp500 == 100.0
    assert collected_at is not None


@patch("app.services.macro_collector._fetch_price")
def test_collect_macro_data_partial_failure(mock_fetch):
    """일부 티커 실패 시 해당 필드가 None이고 failed 목록에 포함된다."""
    def side_effect(ticker):
        if ticker in ("KRW=X", "CL=F"):
            return None
        return 50.0

    mock_fetch.side_effect = side_effect

    snapshot, failed, _ = collect_macro_data()

    assert "KRW=X" in failed
    assert "CL=F" in failed
    assert snapshot.exchange_rates.usd_krw is None
    assert snapshot.commodities.wti is None
    # 성공한 티커는 값이 있어야 함
    assert snapshot.global_indices.sp500 == 50.0
