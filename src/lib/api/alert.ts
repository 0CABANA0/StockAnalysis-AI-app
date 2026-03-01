/**
 * Alert(가격 알림) API 클라이언트.
 */

import { apiFetch } from "./client";

// ─── 타입 ───

export interface PriceAlert {
  id: string;
  user_id: string;
  ticker: string;
  company_name: string | null;
  alert_type: string; // TARGET_PRICE | STOP_LOSS
  trigger_price: number;
  current_price: number | null;
  is_triggered: boolean;
  triggered_at: string | null;
  memo: string | null;
  created_at: string;
}

interface PriceAlertsListResponse {
  alerts: PriceAlert[];
  total: number;
}

// ─── API 함수 ───

/** 내 가격 알림 목록 */
export async function listAlerts(): Promise<PriceAlert[]> {
  const res = await apiFetch<PriceAlertsListResponse>("/alert/my");
  return res.alerts;
}

/** 가격 알림 생성 */
export async function createAlert(data: {
  ticker: string;
  company_name?: string;
  alert_type: string;
  trigger_price: number;
  memo?: string;
}): Promise<PriceAlert> {
  return apiFetch<PriceAlert>("/alert/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** 가격 알림 삭제 */
export async function deleteAlert(
  alertId: string,
): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/alert/${alertId}`, { method: "DELETE" });
}

// ─── 관리자 전용 ───

export interface AlertCheckResult {
  checked_count: number;
  triggered_count: number;
  notified_count: number;
  failed_tickers: string[];
  checked_at: string;
}

export interface RiskAlertResult {
  vix_alert: boolean;
  vix_value: number | null;
  geopolitical_alert: boolean;
  high_urgency_count: number;
  currency_alert: boolean;
  usd_krw_change_pct: number | null;
  notifications_sent: number;
  checked_at: string;
}

/** [관리자] 가격 알림 수동 확인 */
export async function checkPriceAlerts(): Promise<AlertCheckResult> {
  return apiFetch<AlertCheckResult>("/alert/check", { method: "POST" });
}

/** [관리자] 리스크 알림 수동 확인 (VIX·환율·지정학) */
export async function checkRiskAlerts(): Promise<RiskAlertResult> {
  return apiFetch<RiskAlertResult>("/alert/risk-check", { method: "POST" });
}
