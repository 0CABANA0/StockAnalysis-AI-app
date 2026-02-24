/**
 * Alert API 클라이언트 — 가격 알림 CRUD.
 * 클라이언트 컴포넌트에서 사용. 서버 액션은 serverApiFetch()를 직접 호출.
 */

import { apiFetch } from "./client";

// ─── 응답 타입 ───

export interface PriceAlertResponse {
  id: string;
  user_id: string;
  ticker: string;
  company_name: string | null;
  alert_type: string;
  trigger_price: number;
  current_price: number | null;
  is_triggered: boolean;
  triggered_at: string | null;
  memo: string | null;
  created_at: string;
}

export interface PriceAlertsListResponse {
  alerts: PriceAlertResponse[];
  total: number;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

// ─── 요청 타입 ───

export interface PriceAlertCreateRequest {
  ticker: string;
  company_name?: string | null;
  alert_type: string;
  trigger_price: number;
  memo?: string | null;
}

// ─── API 함수 ───

export async function fetchMyAlerts(): Promise<PriceAlertsListResponse> {
  return apiFetch("/alert/my");
}

export async function createPriceAlert(
  req: PriceAlertCreateRequest,
): Promise<PriceAlertResponse> {
  return apiFetch("/alert/", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function removePriceAlert(id: string): Promise<DeleteResponse> {
  return apiFetch(`/alert/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
