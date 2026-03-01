"""관심종목 CRUD 테스트."""

from unittest.mock import MagicMock


# ---------------------------------------------------------------------------
# GET /api/watchlist/
# ---------------------------------------------------------------------------


def test_get_watchlist_empty(client, mock_supabase):
    """관심종목이 없으면 빈 리스트를 반환한다."""
    mock_supabase.table.return_value.execute.return_value = MagicMock(data=[])

    res = client.get("/api/watchlist/")
    assert res.status_code == 200
    body = res.json()
    assert body["items"] == []
    assert body["total"] == 0


def test_get_watchlist_with_items(client, mock_supabase):
    """관심종목이 있으면 목록을 반환한다."""
    fake_items = [
        {
            "id": "wl-001",
            "ticker": "AAPL",
            "company_name": "Apple Inc.",
            "market": "US",
            "asset_type": "STOCK",
            "added_at": "2026-02-28T06:00:00+00:00",
        },
        {
            "id": "wl-002",
            "ticker": "005930",
            "company_name": "삼성전자",
            "market": "KR",
            "asset_type": "STOCK",
            "added_at": "2026-02-27T06:00:00+00:00",
        },
    ]
    mock_supabase.table.return_value.execute.return_value = MagicMock(
        data=fake_items
    )

    res = client.get("/api/watchlist/")
    assert res.status_code == 200
    body = res.json()
    assert body["total"] == 2
    assert body["items"][0]["ticker"] == "AAPL"
    assert body["items"][1]["company_name"] == "삼성전자"


# ---------------------------------------------------------------------------
# POST /api/watchlist/
# ---------------------------------------------------------------------------


def test_add_watchlist_item(client, mock_supabase):
    """관심종목 추가 시 생성된 항목을 반환한다."""
    inserted = {
        "id": "wl-new",
        "ticker": "TSLA",
        "company_name": "Tesla Inc.",
        "market": "US",
        "asset_type": "STOCK",
        "added_at": "2026-02-28T10:00:00+00:00",
    }
    mock_supabase.table.return_value.execute.return_value = MagicMock(
        data=[inserted]
    )

    res = client.post(
        "/api/watchlist/",
        json={
            "ticker": "TSLA",
            "company_name": "Tesla Inc.",
            "market": "US",
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["ticker"] == "TSLA"
    assert body["id"] == "wl-new"


def test_add_watchlist_item_failure(client, mock_supabase):
    """DB 삽입 실패 시 400을 반환한다."""
    mock_supabase.table.return_value.execute.return_value = MagicMock(data=[])

    res = client.post(
        "/api/watchlist/",
        json={
            "ticker": "FAIL",
            "company_name": "Fail Corp.",
            "market": "US",
        },
    )
    assert res.status_code == 400


# ---------------------------------------------------------------------------
# DELETE /api/watchlist/{item_id}
# ---------------------------------------------------------------------------


def test_delete_watchlist_item(client, mock_supabase):
    """관심종목 삭제 시 success를 반환한다."""
    mock_supabase.table.return_value.execute.return_value = MagicMock(data=[])

    res = client.delete("/api/watchlist/wl-001")
    assert res.status_code == 200
    assert res.json()["success"] is True
