/**
 * Image Analysis API 클라이언트 — Vision OCR + 종목 검증 + AI 투자 가이드.
 */

import { apiFetch } from "./client";

// ─── 타입 ───

export interface RecognizedHolding {
  ticker: string | null;
  name: string;
  quantity: number | null;
  avg_price: number | null;
  current_price: number | null;
  profit_loss_rate: number | null;
  confidence: number;
  verified: boolean;
}

export interface SectorAnalysis {
  name: string;
  weight_pct: number;
  assessment: string;
}

export interface HoldingRecommendation {
  ticker: string | null;
  name: string;
  opinion: string;
  rationale: string;
  target_price: number | null;
  stop_loss: number | null;
}

export interface ActionPlan {
  this_week: string[];
  this_month: string[];
  three_months: string[];
}

export interface InvestmentGuide {
  diagnosis: string;
  sector_analysis: SectorAnalysis[];
  recommendations: HoldingRecommendation[];
  risk_level: string;
  action_plan: ActionPlan;
}

export interface ImageAnalysisResponse {
  holdings: RecognizedHolding[];
  investment_guide: InvestmentGuide | null;
  validation_status: string;
  processing_time_ms: number;
}

// ─── API 함수 ───

export async function analyzeImage(
  imageData: string,
  mediaType: string,
): Promise<ImageAnalysisResponse> {
  return apiFetch<ImageAnalysisResponse>("/image/analyze", {
    method: "POST",
    body: JSON.stringify({
      image_data: imageData,
      media_type: mediaType,
    }),
  });
}
