/**
 * Prediction(종합 스코어링) API 클라이언트.
 */

import { apiFetch } from "./client";

// ─── 타입 ───

export interface TechnicalSignal {
  rsi_score: number;
  macd_score: number;
  bb_score: number;
  composite: number;
}

export interface MacroSignal {
  vix_score: number;
  yield_score: number;
  index_score: number;
  composite: number;
}

export interface SentimentSignal {
  avg_weighted_score: number;
  article_count: number;
  composite: number;
}

export interface CurrencySignal {
  usd_krw: number | null;
  usd_krw_direction: string;
  composite: number;
}

export interface GeopoliticalSignal {
  high_urgency_count: number;
  avg_geopolitical_score: number;
  composite: number;
}

export interface SignalBreakdown {
  technical: TechnicalSignal;
  macro: MacroSignal;
  sentiment: SentimentSignal;
  currency: CurrencySignal;
  geopolitical: GeopoliticalSignal;
}

export interface PredictionScore {
  id: string;
  user_id: string;
  ticker: string;
  company_name: string | null;
  technical_score: number | null;
  macro_score: number | null;
  sentiment_score: number | null;
  currency_score: number | null;
  geopolitical_score: number | null;
  short_term_score: number;
  medium_term_score: number | null;
  direction: string;
  risk_level: string;
  opinion: string | null;
  report_text: string | null;
  scenario_bull: Record<string, string> | null;
  scenario_base: Record<string, string> | null;
  scenario_bear: Record<string, string> | null;
  analyzed_at: string;
  created_at: string;
}

interface PredictionAnalyzeResponse {
  success: boolean;
  ticker: string;
  score: PredictionScore;
  signal_breakdown: SignalBreakdown;
}

interface PredictionScoresListResponse {
  results: PredictionScore[];
  total: number;
  limit: number;
  offset: number;
}

// ─── API 함수 ───

/** 종목 종합 분석 실행 (POST). */
export async function analyzePrediction(
  ticker: string,
  companyName?: string,
): Promise<PredictionAnalyzeResponse> {
  return apiFetch<PredictionAnalyzeResponse>("/prediction/analyze", {
    method: "POST",
    body: JSON.stringify({ ticker, company_name: companyName }),
  });
}

/** 내 분석 이력 목록 (GET). */
export async function listPredictions(
  limit = 20,
  offset = 0,
): Promise<PredictionScoresListResponse> {
  return apiFetch<PredictionScoresListResponse>(
    `/prediction/scores?limit=${limit}&offset=${offset}`,
  );
}

/** 특정 종목 최신 분석 (GET). */
export async function getLatestPrediction(
  ticker: string,
): Promise<PredictionScore | null> {
  const res = await apiFetch<{ score: PredictionScore | null }>(
    `/prediction/${encodeURIComponent(ticker)}/latest`,
  );
  return res.score;
}
