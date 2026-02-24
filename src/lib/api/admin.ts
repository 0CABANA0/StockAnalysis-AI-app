/**
 * 관리자 전용 API 클라이언트.
 */

import { apiFetch } from "./client";

// ── 타입 ────────────────────────────────────────

export interface AdminStats {
  user_count: number;
  notification_count: number;
  audit_count: number;
  last_macro_at: string | null;
  last_sentiment_at: string | null;
}

export interface Member {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  role: string;
  status: string;
  telegram_chat_id: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface MembersListResponse {
  members: Member[];
  total: number;
}

export interface AuditLog {
  id: string;
  admin_id: string | null;
  action_type: string;
  target_user_id: string | null;
  detail: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  total: number;
}

export interface NotificationGroup {
  id: string;
  group_code: string;
  description: string;
  auto_condition: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
}

export interface NotificationGroupsResponse {
  groups: NotificationGroup[];
  active_target_count: number;
}

export interface NotificationHistory {
  id: string;
  sender_admin_id: string | null;
  target_type: string;
  target_group: string | null;
  target_user_ids: string[] | null;
  message: string;
  message_format: string;
  success_count: number;
  fail_count: number;
  sent_at: string;
  created_at: string;
}

export interface NotificationHistoryResponse {
  history: NotificationHistory[];
  total: number;
}

export interface ModelConfig {
  id: string;
  config_key: string;
  display_name: string;
  primary_model: string;
  fallback_model: string | null;
  max_tokens: number;
  temperature: number;
  is_active: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModelsListResponse {
  models: ModelConfig[];
  total: number;
}

export interface SystemSettings {
  scheduler_active: boolean;
  data_retention_days: number;
  max_watchlist_items: number;
  api_rate_limit: number;
}

// ── GET ─────────────────────────────────────────

export function getAdminStats() {
  return apiFetch<AdminStats>("/admin/stats");
}

export function getMembers() {
  return apiFetch<MembersListResponse>("/admin/members");
}

export function getAuditLogs(limit = 100) {
  return apiFetch<AuditLogsResponse>(`/admin/audit-logs?limit=${limit}`);
}

export function getNotificationGroups() {
  return apiFetch<NotificationGroupsResponse>("/admin/notifications/groups");
}

export function getNotificationHistory(limit = 50) {
  return apiFetch<NotificationHistoryResponse>(
    `/admin/notifications/history?limit=${limit}`,
  );
}

export function getModels() {
  return apiFetch<ModelsListResponse>("/admin/models");
}

export function getSystemSettings() {
  return apiFetch<SystemSettings>("/admin/settings");
}

// ── POST / PUT ──────────────────────────────────

export function updateMemberRole(userId: string, role: string) {
  return apiFetch<{ message: string }>(`/admin/members/${userId}/role`, {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

export function sendNotification(params: {
  target_type: string;
  target_group?: string;
  target_user_ids?: string[];
  message: string;
  message_format?: string;
}) {
  return apiFetch<{ message: string }>("/admin/notifications/send", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function updateModelConfig(
  configId: string,
  params: {
    primary_model?: string;
    fallback_model?: string;
    max_tokens?: number;
    temperature?: number;
    is_active?: boolean;
  },
) {
  return apiFetch<{ message: string }>(`/admin/models/${configId}`, {
    method: "PUT",
    body: JSON.stringify(params),
  });
}
