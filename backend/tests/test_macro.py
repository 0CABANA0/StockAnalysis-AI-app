"""거시경제 라우터 테스트."""

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from app.models.macro import ExchangeRates, SnapshotData


# ---------------------------------------------------------------------------
# GET /api/macro/latest
# ---------------------------------------------------------------------------


def test_macro_latest_returns_snapshot(client, mock_supabase):
    """최신 스냅샷이 있을 때 200을 반환한다."""
    fake_row = {
        "id": "snap-001",
        "snapshot_data": {"exchange_rates": {"usd_krw": 1380.5}},
        "usd_krw": 1380.5,
        "vix": 18.5,
        "us_10y_yield": 4.25,
        "wti": 72.3,
        "gold": 2650.0,
        "collected_at": "2026-02-28T06:00:00+00:00",
        "created_at": "2026-02-28T06:00:01+00:00",
    }
    mock_supabase.table.return_value.execute.return_value = MagicMock(
        data=[fake_row]
    )

    res = client.get("/api/macro/latest")
    assert res.status_code == 200
    body = res.json()
    assert body["id"] == "snap-001"
    assert body["usd_krw"] == 1380.5


def test_macro_latest_returns_404_when_empty(client, mock_supabase):
    """스냅샷이 없으면 404를 반환한다."""
    mock_supabase.table.return_value.execute.return_value = MagicMock(data=[])

    res = client.get("/api/macro/latest")
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# GET /api/macro/history
# ---------------------------------------------------------------------------


def test_macro_history_returns_paginated(client, mock_supabase):
    """이력 조회 시 페이지네이션 응답을 반환한다."""
    fake_rows = [
        {
            "id": f"snap-{i}",
            "snapshot_data": {},
            "usd_krw": 1380.0 + i,
            "vix": None,
            "us_10y_yield": None,
            "wti": None,
            "gold": None,
            "collected_at": f"2026-02-{28-i:02d}T06:00:00+00:00",
            "created_at": f"2026-02-{28-i:02d}T06:00:01+00:00",
        }
        for i in range(3)
    ]

    # count 쿼리와 데이터 쿼리가 별개이므로 side_effect로 구분
    count_mock = MagicMock(data=[], count=10)
    data_mock = MagicMock(data=fake_rows)
    mock_supabase.table.return_value.execute.side_effect = [count_mock, data_mock]

    res = client.get("/api/macro/history?limit=3&offset=0")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 10
    assert len(body["snapshots"]) == 3
    assert body["limit"] == 3


# ---------------------------------------------------------------------------
# POST /api/macro/collect (ADMIN only)
# ---------------------------------------------------------------------------


def test_macro_collect_requires_admin(client):
    """일반 사용자가 collect 호출 시 403을 반환한다."""
    res = client.post("/api/macro/collect")
    assert res.status_code == 403


def test_macro_collect_success(admin_client, mock_supabase):
    """ADMIN이 collect 호출 시 수집 결과를 반환한다."""
    fake_snapshot = SnapshotData(
        exchange_rates=ExchangeRates(usd_krw=1380.0),
    )
    collected_at = datetime(2026, 2, 28, 6, 0, tzinfo=timezone.utc)

    # insert_snapshot 후 반환되는 row
    mock_supabase.table.return_value.execute.return_value = MagicMock(
        data=[
            {
                "id": "snap-new",
                "snapshot_data": fake_snapshot.model_dump(),
                "usd_krw": 1380.0,
                "vix": None,
                "us_10y_yield": None,
                "wti": None,
                "gold": None,
                "collected_at": collected_at.isoformat(),
                "created_at": collected_at.isoformat(),
            }
        ]
    )

    with patch(
        "app.routers.macro.collect_macro_data",
        return_value=(fake_snapshot, [], collected_at),
    ):
        res = admin_client.post("/api/macro/collect")

    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["failed_tickers"] == []
