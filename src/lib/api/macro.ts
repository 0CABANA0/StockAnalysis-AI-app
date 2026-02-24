/**
 * Macro & Sentiment API 클라이언트.
 * 거시경제 데이터 수집 및 뉴스 감성 분석 백엔드 연동.
 */

import { apiFetch } from "./client";
import type {
  SentimentResult,
  NewsCategoryConfig,
  NewsCategorySummary,
} from "@/types";

// ─── 거시 데이터 ───

interface MacroCollectResponse {
  success: boolean;
  collected_at: string;
  failed_tickers: string[];
}

export async function collectMacroData(): Promise<MacroCollectResponse> {
  return apiFetch("/macro/collect", { method: "POST" });
}

// ─── 감성 분석 ───

interface SentimentCollectResponse {
  success: boolean;
  articles_collected: number;
  articles_analyzed: number;
  collected_at: string;
}

export async function collectSentiment(): Promise<SentimentCollectResponse> {
  return apiFetch("/sentiment/collect", { method: "POST" });
}

interface SentimentResultsResponse {
  results: SentimentResult[];
  total: number;
  limit: number;
  offset: number;
}

export async function getSentimentResults(params?: {
  limit?: number;
  offset?: number;
  news_category?: string;
}): Promise<SentimentResultsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  if (params?.news_category)
    searchParams.set("news_category", params.news_category);

  const query = searchParams.toString();
  return apiFetch(`/sentiment/results${query ? `?${query}` : ""}`);
}

// ─── 뉴스 카테고리 ───

interface NewsCategoriesResponse {
  categories: NewsCategoryConfig[];
}

export async function getNewsCategories(): Promise<NewsCategoriesResponse> {
  return apiFetch("/sentiment/categories");
}

interface CategorySummaryResponse {
  summaries: NewsCategorySummary[];
}

export async function getCategorySummary(): Promise<CategorySummaryResponse> {
  return apiFetch("/sentiment/categories/summary");
}
