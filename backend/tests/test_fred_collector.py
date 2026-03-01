"""FRED 수집 서비스 단위 테스트."""

from unittest.mock import MagicMock, patch

import pandas as pd

from app.models.macro import FredIndicators
from app.services.fred_collector import FRED_SERIES, collect_fred_data


def test_fred_series_count():
    """수집 대상 FRED 시리즈가 5개인지 확인한다."""
    assert len(FRED_SERIES) == 5


def test_fred_series_fields():
    """FRED 시리즈 필드명이 FredIndicators 모델과 일치한다."""
    model_fields = set(FredIndicators.model_fields.keys())
    series_fields = set(FRED_SERIES.values())
    assert series_fields == model_fields


@patch("app.services.fred_collector.settings")
def test_collect_fred_no_api_key(mock_settings):
    """API 키가 없으면 빈 FredIndicators를 반환한다."""
    mock_settings.fred_api_key = ""

    result = collect_fred_data()

    assert isinstance(result, FredIndicators)
    assert result.fed_funds_rate is None
    assert result.treasury_spread is None


@patch("app.services.fred_collector.settings")
def test_collect_fred_all_success(mock_settings):
    """모든 시리즈 수집 성공 시 값이 채워진다."""
    mock_settings.fred_api_key = "test-key"

    mock_fred_instance = MagicMock()
    mock_series = pd.Series([4.33, 4.35], index=pd.date_range("2026-01-01", periods=2))
    mock_fred_instance.get_series.return_value = mock_series

    # fredapi 미설치 환경에서도 동작하도록 sys.modules에 가짜 모듈 주입
    fake_fredapi = MagicMock()
    fake_fredapi.Fred.return_value = mock_fred_instance

    with patch.dict("sys.modules", {"fredapi": fake_fredapi}):
        result = collect_fred_data()

    assert isinstance(result, FredIndicators)
    # 최신값(4.35)이 반환되어야 함
    assert result.fed_funds_rate == 4.35
    assert result.treasury_spread == 4.35
    assert result.breakeven_inflation == 4.35
    assert result.unemployment_rate == 4.35
    assert result.high_yield_spread == 4.35


@patch("app.services.fred_collector.settings")
def test_collect_fred_partial_failure(mock_settings):
    """일부 시리즈 실패 시 해당 필드만 None."""
    mock_settings.fred_api_key = "test-key"

    def mock_get_series(series_id, **kwargs):
        if series_id == "DFF":
            raise Exception("API error")
        return pd.Series([2.5], index=pd.date_range("2026-01-01", periods=1))

    mock_fred_instance = MagicMock()
    mock_fred_instance.get_series.side_effect = mock_get_series

    fake_fredapi = MagicMock()
    fake_fredapi.Fred.return_value = mock_fred_instance

    with patch.dict("sys.modules", {"fredapi": fake_fredapi}):
        result = collect_fred_data()

    assert result.fed_funds_rate is None  # 실패
    assert result.treasury_spread == 2.5  # 성공


@patch("app.services.fred_collector.settings")
def test_collect_fred_init_failure(mock_settings):
    """Fred 클라이언트 초기화 실패 시 빈 결과를 반환한다."""
    mock_settings.fred_api_key = "bad-key"

    fake_fredapi = MagicMock()
    fake_fredapi.Fred.side_effect = Exception("Invalid API key")

    with patch.dict("sys.modules", {"fredapi": fake_fredapi}):
        result = collect_fred_data()

    assert isinstance(result, FredIndicators)
    assert result.fed_funds_rate is None
