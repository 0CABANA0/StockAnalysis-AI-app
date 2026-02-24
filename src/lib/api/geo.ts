import { apiFetch } from "./client";
import type { GeopoliticalRisk, GeopoliticalEvent } from "@/types";

interface GeoCurrentResponse {
  risks: GeopoliticalRisk[];
  total: number;
}

interface GeoRiskDetailResponse {
  risk: GeopoliticalRisk;
  events: GeopoliticalEvent[];
}

interface GeoImpactResponse {
  ticker: string;
  risks: GeopoliticalRisk[];
  overall_exposure: string;
}

export async function getGeoRisks(): Promise<GeoCurrentResponse> {
  return apiFetch<GeoCurrentResponse>("/geo/current");
}

export async function getGeoRiskDetail(
  riskId: string,
): Promise<GeoRiskDetailResponse> {
  return apiFetch<GeoRiskDetailResponse>(`/geo/${riskId}`);
}

export async function getGeoImpact(
  ticker: string,
): Promise<GeoImpactResponse> {
  return apiFetch<GeoImpactResponse>(`/geo/impact/${ticker}`);
}
