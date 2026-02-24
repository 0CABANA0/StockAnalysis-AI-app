"""관리자 전용 API — 대시보드 통계, 회원, 감사 로그, 알림, 모델 설정."""

from datetime import datetime

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, require_admin
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ──────────────────────────────────────────────
# 응답 모델
# ──────────────────────────────────────────────


class AdminStatsResponse(BaseModel):
    user_count: int = 0
    notification_count: int = 0
    audit_count: int = 0
    last_macro_at: str | None = None
    last_sentiment_at: str | None = None


class MemberResponse(BaseModel):
    id: str
    user_id: str
    email: str | None = None
    display_name: str | None = None
    role: str = "USER"
    status: str = "ACTIVE"
    telegram_chat_id: str | None = None
    last_login: str | None = None
    created_at: str
    updated_at: str


class MembersListResponse(BaseModel):
    members: list[MemberResponse]
    total: int


class AuditLogResponse(BaseModel):
    id: str
    admin_id: str | None = None
    action_type: str
    target_user_id: str | None = None
    detail: dict | None = None
    ip_address: str | None = None
    created_at: str


class AuditLogsListResponse(BaseModel):
    logs: list[AuditLogResponse]
    total: int


class NotificationGroupResponse(BaseModel):
    id: str
    group_code: str
    description: str = ""
    auto_condition: dict | None = None
    is_active: bool = True
    created_at: str


class NotificationGroupsResponse(BaseModel):
    groups: list[NotificationGroupResponse]
    active_target_count: int


class NotificationHistoryResponse(BaseModel):
    id: str
    sender_admin_id: str | None = None
    target_type: str
    target_group: str | None = None
    target_user_ids: list[str] | None = None
    message: str = ""
    message_format: str = "PLAIN"
    success_count: int = 0
    fail_count: int = 0
    sent_at: str
    created_at: str


class NotificationHistoryListResponse(BaseModel):
    history: list[NotificationHistoryResponse]
    total: int


class ModelConfigResponse(BaseModel):
    id: str
    config_key: str
    display_name: str = ""
    primary_model: str = ""
    fallback_model: str | None = None
    max_tokens: int = 4096
    temperature: float = 0.7
    is_active: bool = True
    updated_by: str | None = None
    created_at: str
    updated_at: str


class ModelsListResponse(BaseModel):
    models: list[ModelConfigResponse]
    total: int


# ──────────────────────────────────────────────
# 엔드포인트
# ──────────────────────────────────────────────


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    _admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """관리자 대시보드 통계."""
    logger.info("관리자 통계 조회: user=%s", _admin.user_id)

    users_resp = client.table("user_profiles").select("id", count="exact").execute()
    notif_resp = client.table("notification_history").select("id", count="exact").execute()
    audit_resp = client.table("audit_logs").select("id", count="exact").execute()

    macro_resp = (
        client.table("macro_snapshots")
        .select("created_at")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    sentiment_resp = (
        client.table("sentiment_results")
        .select("created_at")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    return AdminStatsResponse(
        user_count=users_resp.count or 0,
        notification_count=notif_resp.count or 0,
        audit_count=audit_resp.count or 0,
        last_macro_at=macro_resp.data[0]["created_at"] if macro_resp.data else None,
        last_sentiment_at=sentiment_resp.data[0]["created_at"] if sentiment_resp.data else None,
    )


@router.get("/members", response_model=MembersListResponse)
def get_members(
    _admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """전체 회원 목록."""
    logger.info("회원 목록 조회: user=%s", _admin.user_id)

    resp = (
        client.table("user_profiles")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    members = [MemberResponse(**row) for row in resp.data]
    return MembersListResponse(members=members, total=len(members))


@router.get("/audit-logs", response_model=AuditLogsListResponse)
def get_audit_logs(
    limit: int = Query(default=100, ge=1, le=500),
    _admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """감사 로그 목록."""
    logger.info("감사 로그 조회: user=%s", _admin.user_id)

    resp = (
        client.table("audit_logs")
        .select("*")
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    logs = [AuditLogResponse(**row) for row in resp.data]
    return AuditLogsListResponse(logs=logs, total=len(logs))


@router.get("/notifications/groups", response_model=NotificationGroupsResponse)
def get_notification_groups(
    _admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """알림 그룹 목록 + 활성 대상 수."""
    logger.info("알림 그룹 조회: user=%s", _admin.user_id)

    groups_resp = (
        client.table("notification_groups")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    targets_resp = (
        client.table("notification_targets")
        .select("id", count="exact")
        .eq("is_active", True)
        .execute()
    )

    groups = [NotificationGroupResponse(**row) for row in groups_resp.data]
    return NotificationGroupsResponse(
        groups=groups,
        active_target_count=targets_resp.count or 0,
    )


@router.get("/notifications/history", response_model=NotificationHistoryListResponse)
def get_notification_history(
    limit: int = Query(default=50, ge=1, le=500),
    _admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """알림 발송 이력."""
    logger.info("알림 발송 이력 조회: user=%s", _admin.user_id)

    resp = (
        client.table("notification_history")
        .select("*")
        .order("sent_at", desc=True)
        .limit(limit)
        .execute()
    )
    history = [NotificationHistoryResponse(**row) for row in resp.data]
    return NotificationHistoryListResponse(history=history, total=len(history))


@router.get("/models", response_model=ModelsListResponse)
def get_models(
    _admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """AI 모델 설정 목록."""
    logger.info("모델 설정 조회: user=%s", _admin.user_id)

    resp = (
        client.table("model_configs")
        .select("*")
        .order("config_key", desc=False)
        .execute()
    )
    models = [ModelConfigResponse(**row) for row in resp.data]
    return ModelsListResponse(models=models, total=len(models))
