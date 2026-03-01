"""테스트 공통 픽스처.

외부 의존성(Supabase, 스케줄러, 텔레그램)을 모두 차단하고
FastAPI TestClient를 제공한다.
"""

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user, require_admin


# ---------------------------------------------------------------------------
# Mock Supabase 클라이언트
# ---------------------------------------------------------------------------


def _mock_supabase() -> MagicMock:
    """체이닝 쿼리를 지원하는 Mock Supabase 클라이언트."""
    client = MagicMock()
    # .table("x").select("*").eq("k","v").execute() 체이닝 지원
    table = MagicMock()
    table.select.return_value = table
    table.insert.return_value = table
    table.delete.return_value = table
    table.update.return_value = table
    table.eq.return_value = table
    table.order.return_value = table
    table.limit.return_value = table
    table.range.return_value = table
    table.single.return_value = table
    table.execute.return_value = MagicMock(data=[], count=0)
    client.table.return_value = table
    return client


# ---------------------------------------------------------------------------
# 인증 Mock
# ---------------------------------------------------------------------------

MOCK_USER = CurrentUser(user_id="test-user-id", email="test@test.com", role="USER")
MOCK_ADMIN = CurrentUser(
    user_id="admin-user-id", email="admin@test.com", role="ADMIN"
)


# ---------------------------------------------------------------------------
# TestClient 픽스처
# ---------------------------------------------------------------------------


@pytest.fixture()
def mock_supabase():
    """Mock Supabase 클라이언트를 반환한다."""
    return _mock_supabase()


def _mock_telegram():
    """비동기 메서드를 가진 Mock 텔레그램 서비스."""
    mock = MagicMock()
    mock.build_bot_application.return_value = None
    mock.start_bot = AsyncMock()
    mock.stop_bot = AsyncMock()
    return mock


@pytest.fixture()
def client(mock_supabase):
    """스케줄러/텔레그램을 비활성화한 TestClient."""
    with (
        patch("app.main.start_scheduler"),
        patch("app.main.stop_scheduler"),
        patch("app.main.telegram_service", _mock_telegram()),
        patch("app.config.settings.scheduler_enabled", False),
        patch("app.config.settings.telegram_bot_enabled", False),
    ):
        from app.main import app

        # 의존성 오버라이드
        app.dependency_overrides[get_supabase] = lambda: mock_supabase
        app.dependency_overrides[get_current_user] = lambda: MOCK_USER

        with TestClient(app) as tc:
            yield tc

        app.dependency_overrides.clear()


@pytest.fixture()
def admin_client(mock_supabase):
    """ADMIN 권한이 부여된 TestClient."""
    with (
        patch("app.main.start_scheduler"),
        patch("app.main.stop_scheduler"),
        patch("app.main.telegram_service", _mock_telegram()),
        patch("app.config.settings.scheduler_enabled", False),
        patch("app.config.settings.telegram_bot_enabled", False),
    ):
        from app.main import app

        app.dependency_overrides[get_supabase] = lambda: mock_supabase
        app.dependency_overrides[get_current_user] = lambda: MOCK_ADMIN
        app.dependency_overrides[require_admin] = lambda: MOCK_ADMIN

        with TestClient(app) as tc:
            yield tc

        app.dependency_overrides.clear()
