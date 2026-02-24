/**
 * Portfolio API 클라이언트 — 포트폴리오, 거래, 분배금 CRUD.
 * 클라이언트 컴포넌트에서 사용. 서버 액션은 serverApiFetch()를 직접 호출.
 */

import { apiFetch } from "./client";

// ─── 응답 타입 ───

export interface PortfolioResponse {
  id: string;
  user_id: string;
  ticker: string;
  company_name: string;
  market: string;
  sector: string | null;
  industry: string | null;
  memo: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionResponse {
  id: string;
  portfolio_id: string;
  user_id: string;
  type: string;
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  trade_date: string;
  memo: string | null;
  created_at: string;
}

export interface DistributionResponse {
  id: string;
  portfolio_id: string;
  user_id: string;
  amount: number;
  distribution_type: string;
  record_date: string;
  payment_date: string | null;
  memo: string | null;
  created_at: string;
}

export interface HoldingStatsResponse {
  avg_price: number;
  quantity: number;
  total_invested: number;
  total_fees: number;
  realized_pnl: number;
}

export interface PortfolioListResponse {
  portfolios: PortfolioResponse[];
  total: number;
}

export interface PortfolioDetailResponse {
  portfolio: PortfolioResponse;
  transactions: TransactionResponse[];
  distributions: DistributionResponse[];
  stats: HoldingStatsResponse;
}

export interface TransactionListResponse {
  transactions: TransactionResponse[];
  total: number;
}

export interface DistributionListResponse {
  distributions: DistributionResponse[];
  total: number;
}

export interface DeleteResponse {
  success: boolean;
  message: string;
}

// ─── 요청 타입 ───

export interface PortfolioCreateRequest {
  ticker: string;
  company_name: string;
  market: string;
  sector?: string | null;
  industry?: string | null;
  memo?: string | null;
}

export interface TransactionCreateRequest {
  portfolio_id: string;
  type: "BUY" | "SELL";
  quantity: number;
  price: number;
  fee?: number;
  trade_date: string;
  memo?: string | null;
}

export interface DistributionCreateRequest {
  portfolio_id: string;
  amount: number;
  distribution_type: string;
  record_date: string;
  payment_date?: string | null;
  memo?: string | null;
}

// ─── API 함수 ───

export async function fetchMyPortfolios(): Promise<PortfolioListResponse> {
  return apiFetch("/portfolio/my");
}

export async function fetchPortfolioDetail(
  id: string,
): Promise<PortfolioDetailResponse> {
  return apiFetch(`/portfolio/${encodeURIComponent(id)}/detail`);
}

export async function fetchTransactions(
  id: string,
): Promise<TransactionListResponse> {
  return apiFetch(`/portfolio/${encodeURIComponent(id)}/transactions`);
}

export async function fetchDistributions(
  id: string,
): Promise<DistributionListResponse> {
  return apiFetch(`/portfolio/${encodeURIComponent(id)}/distributions`);
}

export async function createPortfolio(
  req: PortfolioCreateRequest,
): Promise<PortfolioResponse> {
  return apiFetch("/portfolio/", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function createTransaction(
  req: TransactionCreateRequest,
): Promise<TransactionResponse> {
  return apiFetch("/portfolio/transaction", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function createDistribution(
  req: DistributionCreateRequest,
): Promise<DistributionResponse> {
  return apiFetch("/portfolio/distribution", {
    method: "POST",
    body: JSON.stringify(req),
  });
}

export async function removePortfolio(id: string): Promise<DeleteResponse> {
  return apiFetch(`/portfolio/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
