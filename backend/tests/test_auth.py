"""인증 미들웨어 단위 테스트."""

from app.middleware.auth import CurrentUser


def test_current_user_is_admin():
    """ADMIN 역할은 is_admin=True."""
    user = CurrentUser(user_id="u1", email="a@b.com", role="ADMIN")
    assert user.is_admin is True
    assert user.is_super_admin is False


def test_current_user_is_super_admin():
    """SUPER_ADMIN 역할은 is_admin=True, is_super_admin=True."""
    user = CurrentUser(user_id="u2", email="s@b.com", role="SUPER_ADMIN")
    assert user.is_admin is True
    assert user.is_super_admin is True


def test_current_user_regular():
    """USER 역할은 관리자가 아니다."""
    user = CurrentUser(user_id="u3", email="u@b.com", role="USER")
    assert user.is_admin is False
    assert user.is_super_admin is False
