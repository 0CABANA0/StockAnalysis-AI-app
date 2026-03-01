import { apiFetch } from "./client";

/* ── 일반 시나리오 ── */

interface SimulationRequest {
  scenario_type: string;
  params: Record<string, unknown>;
}

interface SimulationResult {
  scenario_type: string;
  params: Record<string, unknown>;
  result: Record<string, unknown>;
}

export async function runSimulation(
  data: SimulationRequest,
): Promise<SimulationResult> {
  return apiFetch<SimulationResult>("/simulator/analyze", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/* ── 포트폴리오 기반 시나리오 ── */

export interface PortfolioHolding {
  ticker: string;
  name: string;
  quantity?: number;
  avg_price?: number;
  current_price?: number;
  profit_loss_rate?: number;
  confidence?: number;
}

export interface PortfolioHoldingImpact {
  ticker: string;
  name: string;
  direction: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  magnitude: "LOW" | "MEDIUM" | "HIGH";
  reason: string;
  action: string;
}

export interface PortfolioSimResult {
  summary?: string;
  probability?: string;
  time_horizon?: string;
  impact?: Record<
    string,
    { direction: string; magnitude: string; description: string }
  >;
  portfolio_impact?: PortfolioHoldingImpact[];
  recommended_actions?: string[];
}

interface PortfolioSimulationRequest {
  scenario_type: string;
  params: Record<string, unknown>;
  image_data?: string;
  media_type?: string;
  holdings?: PortfolioHolding[];
}

interface PortfolioSimulationResponse {
  scenario_type: string;
  params: Record<string, unknown>;
  result: PortfolioSimResult;
  holdings: PortfolioHolding[] | null;
}

export async function runPortfolioSimulation(
  data: PortfolioSimulationRequest,
): Promise<PortfolioSimulationResponse> {
  return apiFetch<PortfolioSimulationResponse>("/simulator/analyze-portfolio", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
