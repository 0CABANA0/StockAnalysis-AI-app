import { apiFetch } from "./client";

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
