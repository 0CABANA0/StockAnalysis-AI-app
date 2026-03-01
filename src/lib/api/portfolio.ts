/**
 * Portfolio(포트폴리오) API 클라이언트.
 */

import { apiFetch } from "./client";

// ─── 타입 ───

export interface Portfolio {
  id: string;
  user_id: string;
  ticker: string;
  company_name: string;
  market: string;
  account_type: string;
  sector: string | null;
  industry: string | null;
  memo: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  portfolio_id: string;
  user_id: string;
  type: string; // BUY | SELL
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  trade_date: string;
  memo: string | null;
  created_at: string;
}

export interface Distribution {
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

export interface HoldingStats {
  avg_price: number;
  quantity: number;
  total_invested: number;
  total_fees: number;
  realized_pnl: number;
}

export interface PortfolioDetail {
  portfolio: Portfolio;
  transactions: Transaction[];
  distributions: Distribution[];
  stats: HoldingStats;
}

interface PortfolioListResponse {
  portfolios: Portfolio[];
  total: number;
}

// ─── API 함수 ───

/** 내 포트폴리오 목록 */
export async function listPortfolios(
  accountType?: string,
): Promise<Portfolio[]> {
  const query = accountType ? `?account_type=${accountType}` : "";
  const res = await apiFetch<PortfolioListResponse>(`/portfolio/my${query}`);
  return res.portfolios;
}

/** 포트폴리오 상세 (거래 + 분배금 + 통계) */
export async function getPortfolioDetail(
  portfolioId: string,
): Promise<PortfolioDetail> {
  return apiFetch<PortfolioDetail>(`/portfolio/${portfolioId}/detail`);
}

/** 포트폴리오 추가 */
export async function createPortfolio(data: {
  ticker: string;
  company_name: string;
  market: string;
  account_type?: string;
  memo?: string;
}): Promise<Portfolio> {
  return apiFetch<Portfolio>("/portfolio/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** 거래 등록 */
export async function createTransaction(data: {
  portfolio_id: string;
  type: string;
  quantity: number;
  price: number;
  fee?: number;
  trade_date: string;
  memo?: string;
}): Promise<Transaction> {
  return apiFetch<Transaction>("/portfolio/transaction", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** 포트폴리오 삭제 (소프트) */
export async function deletePortfolio(
  portfolioId: string,
): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/portfolio/${portfolioId}`, { method: "DELETE" });
}

/** 거래 삭제 */
export async function deleteTransaction(
  txId: string,
): Promise<{ success: boolean; message: string }> {
  return apiFetch(`/portfolio/transaction/${txId}`, { method: "DELETE" });
}
