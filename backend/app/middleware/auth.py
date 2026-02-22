from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.dependencies import get_supabase

security = HTTPBearer()


@dataclass
class CurrentUser:
    user_id: str
    email: str
    role: str

    @property
    def is_admin(self) -> bool:
        return self.role in ("ADMIN", "SUPER_ADMIN")

    @property
    def is_super_admin(self) -> bool:
        return self.role == "SUPER_ADMIN"


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> CurrentUser:
    """JWT 토큰을 검증하고 현재 사용자 정보를 반환한다."""
    token = credentials.credentials
    supabase = get_supabase()

    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 인증 토큰입니다.",
            )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 토큰 검증에 실패했습니다.",
        )

    # user_profiles에서 role/status 조회
    profile_response = (
        supabase.table("user_profiles")
        .select("role, status")
        .eq("user_id", user.id)
        .single()
        .execute()
    )

    profile = profile_response.data
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="사용자 프로필을 찾을 수 없습니다.",
        )

    if profile["status"] == "SUSPENDED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="계정이 정지되었습니다.",
        )

    return CurrentUser(
        user_id=user.id,
        email=user.email or "",
        role=profile["role"],
    )


async def require_admin(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """ADMIN 이상 역할을 요구한다."""
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다.",
        )
    return user


async def require_super_admin(
    user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    """SUPER_ADMIN 역할을 요구한다."""
    if not user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="슈퍼 관리자 권한이 필요합니다.",
        )
    return user
