"""사용자 프로필 API 엔드포인트."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/user", tags=["user"])


class UserMeResponse(BaseModel):
    user_id: str
    email: str
    display_name: str | None = None
    role: str = "USER"


@router.get("/me", response_model=UserMeResponse)
def get_me(
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """현재 인증된 사용자의 프로필을 반환한다."""
    logger.info("사용자 프로필 조회: user=%s", user.user_id)

    profile_resp = (
        client.table("user_profiles")
        .select("display_name, role")
        .eq("user_id", user.user_id)
        .single()
        .execute()
    )

    if not profile_resp.data:
        raise HTTPException(status_code=404, detail="프로필을 찾을 수 없습니다.")

    return UserMeResponse(
        user_id=user.user_id,
        email=user.email,
        display_name=profile_resp.data.get("display_name"),
        role=profile_resp.data.get("role", "USER"),
    )
