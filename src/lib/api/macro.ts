/**
 * Macro & Sentiment API 클라이언트.
 * 거시경제 데이터 수집 및 뉴스 감성 분석 백엔드 연동.
 */

import { apiFetch } from "./client";

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
