"""ECOS 수집 서비스 단위 테스트."""

from unittest.mock import MagicMock, patch

from app.models.macro import EcosIndicators
from app.services.ecos_collector import ECOS_SERIES, collect_ecos_data


def test_ecos_series_count():
    """수집 대상 ECOS 시리즈가 3개인지 확인한다."""
    assert len(ECOS_SERIES) == 3


def test_ecos_series_fields():
    """ECOS 시리즈 필드명이 EcosIndicators 모델과 일치한다."""
    model_fields = set(EcosIndicators.model_fields.keys())
    series_fields = {s[3] for s in ECOS_SERIES}  # field_name은 4번째 요소
    assert series_fields == model_fields


@patch("app.services.ecos_collector.settings")
def test_collect_ecos_no_api_key(mock_settings):
    """API 키가 없으면 빈 EcosIndicators를 반환한다."""
    mock_settings.ecos_api_key = ""

    result = collect_ecos_data()

    assert isinstance(result, EcosIndicators)
    assert result.bok_base_rate is None
    assert result.korea_treasury_3y is None
    assert result.korea_cpi_yoy is None


@patch("app.services.ecos_collector.settings")
@patch("app.services.ecos_collector.httpx")
def test_collect_ecos_all_success(mock_httpx, mock_settings):
    """모든 지표 수집 성공 시 값이 채워진다."""
    mock_settings.ecos_api_key = "test-key"

    # ECOS API 응답 mock
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "StatisticSearch": {
            "row": [
                {"DATA_VALUE": "3.50", "TIME": "20260101"},
            ],
        },
    }
    mock_response.raise_for_status = MagicMock()
    mock_httpx.get.return_value = mock_response
    mock_httpx.TimeoutException = Exception
    mock_httpx.HTTPError = Exception

    result = collect_ecos_data()

    assert isinstance(result, EcosIndicators)
    assert result.bok_base_rate == 3.5
    assert result.korea_treasury_3y == 3.5
    assert result.korea_cpi_yoy == 3.5


@patch("app.services.ecos_collector.settings")
@patch("app.services.ecos_collector.httpx")
def test_collect_ecos_api_error(mock_httpx, mock_settings):
    """ECOS API 에러 응답 시 None을 반환한다."""
    mock_settings.ecos_api_key = "test-key"

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "RESULT": {
            "CODE": "ERROR",
            "MESSAGE": "인증키가 유효하지 않습니다.",
        },
    }
    mock_response.raise_for_status = MagicMock()
    mock_httpx.get.return_value = mock_response
    mock_httpx.TimeoutException = Exception
    mock_httpx.HTTPError = Exception

    result = collect_ecos_data()

    assert result.bok_base_rate is None
    assert result.korea_treasury_3y is None


@patch("app.services.ecos_collector.settings")
@patch("app.services.ecos_collector.httpx")
def test_collect_ecos_timeout(mock_httpx, mock_settings):
    """타임아웃 시 None을 반환하고 다른 지표는 계속 수집한다."""
    mock_settings.ecos_api_key = "test-key"

    call_count = 0

    def side_effect(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise Exception("timeout")
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "StatisticSearch": {
                "row": [{"DATA_VALUE": "2.75"}],
            },
        }
        mock_resp.raise_for_status = MagicMock()
        return mock_resp

    mock_httpx.get.side_effect = side_effect
    mock_httpx.TimeoutException = Exception
    mock_httpx.HTTPError = Exception

    result = collect_ecos_data()

    assert result.bok_base_rate is None  # 첫 번째 — 타임아웃
    assert result.korea_treasury_3y == 2.75  # 두 번째 — 성공
