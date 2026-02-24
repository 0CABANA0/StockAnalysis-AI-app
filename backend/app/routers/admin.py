"""관리자 전용 API — 대시보드 통계, 회원, 감사 로그, 알림, 모델 설정."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, require_admin, require_super_admin
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


# ──────────────────────────────────────────────
# 쓰기 엔드포인트 — 요청 모델
# ──────────────────────────────────────────────


class MemberRoleUpdateRequest(BaseModel):
    role: str  # USER | ADMIN | SUSPENDED


class SendNotificationRequest(BaseModel):
    target_type: str = "ALL"  # ALL | GROUP | INDIVIDUAL
    target_group: str | None = None
    target_user_ids: list[str] | None = None
    message: str
    message_format: str = "PLAIN"  # PLAIN | MARKDOWN


class ModelConfigUpdateRequest(BaseModel):
    primary_model: str | None = None
    fallback_model: str | None = None
    max_tokens: int | None = None
    temperature: float | None = None
    is_active: bool | None = None


class SystemSettingsResponse(BaseModel):
    scheduler_active: bool = True
    data_retention_days: int = 90
    max_watchlist_items: int = 20
    api_rate_limit: int = 100


class SystemSettingsUpdateRequest(BaseModel):
    scheduler_active: bool | None = None
    data_retention_days: int | None = None
    max_watchlist_items: int | None = None
    api_rate_limit: int | None = None


# ──────────────────────────────────────────────
# 쓰기 엔드포인트
# ──────────────────────────────────────────────


def _log_audit(
    client: Client, admin_id: str, action: str, target_id: str | None = None, detail: dict | None = None
) -> None:
    """감사 로그 기록 헬퍼."""
    client.table("audit_logs").insert({
        "admin_id": admin_id,
        "action_type": action,
        "target_user_id": target_id,
        "detail": detail or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()


@router.post("/members/{user_id}/role")
def update_member_role(
    user_id: str,
    body: MemberRoleUpdateRequest,
    admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """회원 역할 변경 (정지/복구 포함)."""
    valid_roles = {"USER", "ADMIN", "SUSPENDED"}
    if body.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"유효하지 않은 역할: {body.role}")

    # ADMIN 역할 부여/해제는 SUPER_ADMIN만 가능
    if body.role == "ADMIN" and not admin.is_super_admin:
        raise HTTPException(status_code=403, detail="관리자 역할 변경은 슈퍼 관리자만 가능합니다.")

    # 자기 자신의 역할은 변경 불가
    if user_id == admin.user_id:
        raise HTTPException(status_code=400, detail="자신의 역할은 변경할 수 없습니다.")

    logger.info("회원 역할 변경: admin=%s target=%s role=%s", admin.user_id, user_id, body.role)

    new_status = "SUSPENDED" if body.role == "SUSPENDED" else "ACTIVE"
    new_role = "USER" if body.role == "SUSPENDED" else body.role

    client.table("user_profiles").update({
        "role": new_role,
        "status": new_status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", user_id).execute()

    _log_audit(client, admin.user_id, "ROLE_CHANGE", user_id, {
        "new_role": new_role, "new_status": new_status,
    })

    # role_change_logs에도 기록
    client.table("role_change_logs").insert({
        "changed_by": admin.user_id,
        "target_user_id": user_id,
        "old_role": None,  # 현재 역할 조회 생략 (감사 로그에서 추적)
        "new_role": new_role,
        "reason": f"관리자 역할 변경: {body.role}",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    return {"message": f"회원 역할이 {body.role}(으)로 변경되었습니다."}


@router.post("/notifications/send")
def send_notification(
    body: SendNotificationRequest,
    admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """알림 발송 (텔레그램 등)."""
    logger.info("알림 발송: admin=%s type=%s", admin.user_id, body.target_type)

    now = datetime.now(timezone.utc).isoformat()

    # 발송 이력 기록
    client.table("notification_history").insert({
        "sender_admin_id": admin.user_id,
        "target_type": body.target_type,
        "target_group": body.target_group,
        "target_user_ids": body.target_user_ids,
        "message": body.message,
        "message_format": body.message_format,
        "success_count": 0,
        "fail_count": 0,
        "sent_at": now,
        "created_at": now,
    }).execute()

    _log_audit(client, admin.user_id, "NOTIFICATION_SEND", detail={
        "target_type": body.target_type,
        "message_preview": body.message[:100],
    })

    return {"message": "알림이 발송 대기열에 등록되었습니다."}


@router.put("/models/{config_id}")
def update_model_config(
    config_id: str,
    body: ModelConfigUpdateRequest,
    admin: CurrentUser = Depends(require_admin),
    client: Client = Depends(get_supabase),
):
    """AI 모델 설정 변경."""
    logger.info("모델 설정 변경: admin=%s config=%s", admin.user_id, config_id)

    update_data: dict = {
        "updated_by": admin.user_id,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    if body.primary_model is not None:
        update_data["primary_model"] = body.primary_model
    if body.fallback_model is not None:
        update_data["fallback_model"] = body.fallback_model
    if body.max_tokens is not None:
        update_data["max_tokens"] = body.max_tokens
    if body.temperature is not None:
        update_data["temperature"] = body.temperature
    if body.is_active is not None:
        update_data["is_active"] = body.is_active

    client.table("model_configs").update(update_data).eq("id", config_id).execute()

    # model_change_logs에 기록
    client.table("model_change_logs").insert({
        "changed_by": admin.user_id,
        "config_key": config_id,
        "changes": {k: v for k, v in update_data.items() if k not in ("updated_by", "updated_at")},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    _log_audit(client, admin.user_id, "MODEL_CONFIG_CHANGE", detail={
        "config_id": config_id,
        "changes": update_data,
    })

    return {"message": "모델 설정이 업데이트되었습니다."}


@router.get("/settings", response_model=SystemSettingsResponse)
def get_system_settings(
    _admin: CurrentUser = Depends(require_admin),
):
    """시스템 설정 조회 (현재 기본값 반환)."""
    return SystemSettingsResponse()
