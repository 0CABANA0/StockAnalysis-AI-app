import { apiFetch } from "./client";
import type { EconomicCalendarEvent } from "@/types";

interface CalendarResponse {
  events: EconomicCalendarEvent[];
  total: number;
}

interface CalendarParams {
  start_date?: string;
  end_date?: string;
  event_type?: string;
}

export async function getCalendarEvents(
  params?: CalendarParams,
): Promise<CalendarResponse> {
  const searchParams = new URLSearchParams();
  if (params?.start_date) searchParams.set("start_date", params.start_date);
  if (params?.end_date) searchParams.set("end_date", params.end_date);
  if (params?.event_type) searchParams.set("event_type", params.event_type);

  const query = searchParams.toString();
  return apiFetch<CalendarResponse>(`/calendar/${query ? `?${query}` : ""}`);
}
