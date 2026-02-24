import { apiFetch } from "./client";
import type {
  GuideAction,
  EventImportance,
  InvestmentGuide,
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
