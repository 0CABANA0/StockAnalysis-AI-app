/**
 * Performance(성과 분석) API 클라이언트.
 */

import { apiFetch } from "./client";

// ─── 타입 ───

export interface PerformanceMetrics {
  ticker: string;
  name: string;
  sharpe_ratio: number | null;
  mdd: number | null;
  annualized_return: number | null;
  volatility: number | null;
  total_return: number | null;
  data_points: number;
}

export interface RollingReturn {
  ticker: string;
  window: string;
  value: number | null;
}

export interface CorrelationPair {
  ticker_a: string;
  ticker_b: string;
  correlation: number;
}

export interface PerformanceAnalysisResponse {
  metrics: PerformanceMetrics[];
  rolling_returns: RollingReturn[];
  correlations: CorrelationPair[];
  period: string;
  analyzed_at: string;
}

// ─── API 함수 ───

/** 다중 종목 성과 분석 (POST). */
export async function analyzePerformance(
  tickers: string[],
  period = "1y",
  riskFreeRate = 0.035,
): Promise<PerformanceAnalysisResponse> {
  return apiFetch<PerformanceAnalysisResponse>("/performance/analyze", {
    method: "POST",
    body: JSON.stringify({
      tickers,
      period,
      risk_free_rate: riskFreeRate,
    }),
  });
}
