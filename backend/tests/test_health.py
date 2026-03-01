"""헬스 체크 엔드포인트 테스트."""


def test_health_check_returns_ok(client):
    """GET /api/health → 200, status=ok."""
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert "timestamp" in body
    assert "version" in body
