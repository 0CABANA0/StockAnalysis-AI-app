import { apiFetch } from "./client";
import type {
  GuideAction,
  EventImportance,
  InvestmentGuide,
  CausalChainStep,
} from "@/types";

interface ActionCard {
  ticker: string;
  company_name: string;
  action: GuideAction;
  reason: string;
}

interface KeyEvent {
  time: string;
  title: string;
  importance: EventImportance;
}

export interface TodayGuideResponse {
  briefing_date: string;
  market_summary: string | null;
  geo_summary: string | null;
  market_causal_chain: CausalChainStep[];
  action_cards: ActionCard[];
  key_events: KeyEvent[];
}

export interface TickerGuideResponse {
  guide: InvestmentGuide | null;
}

export async function getTodayGuide(): Promise<TodayGuideResponse> {
  return apiFetch<TodayGuideResponse>("/guide/today");
}

export async function getTickerGuide(
  ticker: string,
): Promise<TickerGuideResponse> {
  return apiFetch<TickerGuideResponse>(`/guide/${ticker}`);
}

// ─── 주간 리포트 ───

export interface WeeklyReportItem {
  id: string;
  week_start_date: string;
  created_at: string;
}

export interface WeeklyReportDetail {
  id: string;
  week_start_date: string;
  macro_summary: string | null;
  geo_summary: string | null;
  next_week_outlook: string | null;
  strategy_guide: string | null;
  created_at: string;
}

interface WeeklyReportListResponse {
  reports: WeeklyReportItem[];
}

interface WeeklyReportDetailResponse {
  report: WeeklyReportDetail | null;
}

/** 최근 주간 리포트 목록 조회. */
export async function listWeeklyReports(
  limit = 12,
): Promise<WeeklyReportItem[]> {
  const res = await apiFetch<WeeklyReportListResponse>(
    `/guide/weekly?limit=${limit}`,
  );
  return res.reports;
}

/** 특정 주간 리포트 상세 조회. */
export async function getWeeklyReport(
  weekStartDate: string,
): Promise<WeeklyReportDetail | null> {
  const res = await apiFetch<WeeklyReportDetailResponse>(
    `/guide/weekly/${encodeURIComponent(weekStartDate)}`,
  );
  return res.report;
}
