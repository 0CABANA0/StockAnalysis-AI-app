/**
 * Stock API 클라이언트 — 캔들, 기술적 지표, 현재가 조회.
 */

import { apiFetch } from "./client";

// ─── 타입 ───

export interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleResponse {
  ticker: string;
  period: string;
  interval: string;
  candles: CandleData[];
  count: number;
}

export interface RSIData {
  value: number | null;
  signal: string;
}

export interface MACDData {
  macd_line: number | null;
  signal_line: number | null;
  histogram: number | null;
  signal: string;
}

export interface BollingerBands {
  upper: number | null;
  middle: number | null;
  lower: number | null;
  signal: string;
}

export interface SMAData {
  sma_20: number | null;
  sma_60: number | null;
  sma_120: number | null;
  signal: string;
}

export interface TechnicalIndicators {
  rsi: RSIData;
  macd: MACDData;
  bollinger_bands: BollingerBands;
  sma: SMAData;
}

export interface IndicatorResponse {
  ticker: string;
  indicators: TechnicalIndicators;
  calculated_at: string;
  data_points: number;
}

export interface StockQuote {
  ticker: string;
  price: number | null;
  change: number | null;
  change_percent: number | null;
  volume: number | null;
  name: string;
  fetched_at: string;
}

// ─── API 함수 ───

export async function fetchCandles(
  ticker: string,
  period = "6mo",
  interval = "1d",
): Promise<CandleResponse> {
  return apiFetch(
    `/stock/${encodeURIComponent(ticker)}/candles?period=${period}&interval=${interval}`,
  );
}

export async function fetchIndicators(
  ticker: string,
): Promise<IndicatorResponse> {
  return apiFetch(`/stock/${encodeURIComponent(ticker)}/indicators`);
}

export async function fetchQuote(ticker: string): Promise<StockQuote> {
  return apiFetch(`/stock/${encodeURIComponent(ticker)}/quote`);
}

interface QuoteResponse {
  quotes: StockQuote[];
  count: number;
}

export async function fetchMultipleQuotes(
  tickers: string[],
): Promise<StockQuote[]> {
  const res = await apiFetch<QuoteResponse>("/stock/quotes", {
    method: "POST",
    body: JSON.stringify({ tickers }),
  });
  return res.quotes;
}
