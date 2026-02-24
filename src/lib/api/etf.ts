/**
 * ETF/펀드 스크리너 API 클라이언트.
 */

import { apiFetch } from "./client";
import type { EtfFundMaster } from "@/types";

interface EtfListResponse {
  items: EtfFundMaster[];
  total: number;
  limit: number;
  offset: number;
}

export async function getEtfList(params?: {
  asset_type?: string;
  category?: string;
  sort_by?: string;
  sort_desc?: boolean;
  limit?: number;
  offset?: number;
}): Promise<EtfListResponse> {
  const sp = new URLSearchParams();
  if (params?.asset_type) sp.set("asset_type", params.asset_type);
  if (params?.category) sp.set("category", params.category);
  if (params?.sort_by) sp.set("sort_by", params.sort_by);
  if (params?.sort_desc) sp.set("sort_desc", "true");
  if (params?.limit) sp.set("limit", String(params.limit));
  if (params?.offset) sp.set("offset", String(params.offset));
  const query = sp.toString();
  return apiFetch(`/etf/list${query ? `?${query}` : ""}`);
}

export async function getEtfDetail(ticker: string): Promise<EtfFundMaster> {
  return apiFetch(`/etf/${encodeURIComponent(ticker)}`);
}

export async function getEtfCategories(): Promise<string[]> {
  return apiFetch("/etf/categories");
}

interface MacroEtfSuggestion {
  scenario: string;
  tickers: string[];
  rationale: string;
  relevance_score: number;
}

interface MacroEtfSuggestionsResponse {
  suggestions: MacroEtfSuggestion[];
  macro_context: Record<string, unknown>;
  generated_at: string;
}

export async function getMacroEtfSuggestions(): Promise<MacroEtfSuggestionsResponse> {
  return apiFetch("/etf/macro/suggestions");
}
