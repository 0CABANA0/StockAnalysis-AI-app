/**
 * 종목 추천 API 클라이언트.
 */

import { apiFetch } from "./client";
import type { Recommendation } from "@/types";

interface RecommendationListResponse {
  recommendations: Recommendation[];
  total: number;
}

export async function getActiveRecommendations(params?: {
  limit?: number;
  offset?: number;
}): Promise<RecommendationListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  const query = searchParams.toString();
  return apiFetch(`/recommendation/active${query ? `?${query}` : ""}`);
}
