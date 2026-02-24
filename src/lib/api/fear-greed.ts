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
