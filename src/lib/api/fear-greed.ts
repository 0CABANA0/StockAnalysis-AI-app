import { apiFetch } from "./client";
import type { FearGreedSnapshot } from "@/types";

interface FearGreedResponse {
  current: FearGreedSnapshot | null;
  history: FearGreedSnapshot[];
}

export async function getFearGreed(
  historyLimit = 30,
): Promise<FearGreedResponse> {
  return apiFetch<FearGreedResponse>(
    `/fear-greed/?history_limit=${historyLimit}`,
  );
}

// ─── 관리자 전용 ───

export interface FearGreedCollectResult {
  value: number;
  label: string;
  collected_at: string;
}

/** [관리자] 공포/탐욕 지수 수동 수집 */
export async function collectFearGreed(): Promise<FearGreedCollectResult> {
  return apiFetch<FearGreedCollectResult>("/fear-greed/collect", {
    method: "POST",
  });
}
