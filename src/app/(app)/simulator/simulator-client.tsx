"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { runSimulation } from "@/lib/api/simulator";
import { Loader2 } from "lucide-react";

interface ScenarioOption {
  type: string;
  title: string;
  desc: string;
  params: Record<string, unknown>;
}

const scenarios: ScenarioOption[] = [
  {
    type: "RATE_HIKE",
    title: "금리 인상 시나리오",
    desc: "기준금리가 0.25%p 인상되면?",
    params: { rate_change: 25 },
  },
  {
    type: "FX_SHOCK",
    title: "환율 급등 시나리오",
    desc: "원/달러 환율 1,500원이면?",
    params: { fx_level: 1500, fx_direction: "급등" },
  },
  {
    type: "GEO_CONFLICT",
    title: "대만 군사 충돌",
    desc: "대만해협 군사 충돌 발생 시?",
    params: { conflict_description: "중국-대만 해협에서 군사적 충돌 발생" },
  },
  {
    type: "TARIFF_WAR",
    title: "미중 관세 확대",
    desc: "미중 상호 관세 50%로 확대 시?",
    params: { tariff_description: "미중 상호 관세율이 50%로 확대" },
  },
];

const directionColor: Record<string, string> = {
  POSITIVE: "text-green-600",
  NEGATIVE: "text-red-600",
  NEUTRAL: "text-yellow-600",
};

interface ImpactDetail {
  direction: string;
  magnitude: string;
  description: string;
}

interface SimResult {
  summary?: string;
  probability?: string;
  time_horizon?: string;
  impact?: Record<string, ImpactDetail>;
  affected_sectors?: { sector: string; impact: string; reason: string }[];
  recommended_actions?: string[];
}

export function SimulatorContent() {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioOption | null>(null);
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async (scenario: ScenarioOption) => {
    setSelectedScenario(scenario);
    setResult(null);
    setLoading(true);
    try {
      const res = await runSimulation({
        scenario_type: scenario.type,
        params: scenario.params,
      });
      setResult(res.result as SimResult);
    } catch {
      setResult({ summary: "시뮬레이션 실행에 실패했습니다. 잠시 후 다시 시도해 주세요." } as SimResult);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 시나리오 선택 */}
      <div className="grid gap-4 md:grid-cols-2">
        {scenarios.map((s) => (
          <Card
            key={s.type}
            className={`cursor-pointer transition-colors ${
              selectedScenario?.type === s.type
                ? "border-primary"
                : "hover:border-primary/50"
            }`}
            onClick={() => handleRun(s)}
          >
            <CardContent className="p-4">
              <p className="font-semibold">{s.title}</p>
              <p className="text-muted-foreground mt-1 text-sm">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 결과 */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center gap-3 p-8">
            <Loader2 className="size-5 animate-spin" />
            <span className="text-sm">AI 분석 중...</span>
          </CardContent>
        </Card>
      )}

      {result && !loading && (
        <div className="space-y-4">
          {/* 요약 */}
          {result.summary && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">분석 요약</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {result.summary}
                </p>
                {result.probability && (
                  <p className="text-muted-foreground mt-2 text-xs">
                    발생 확률: {result.probability} | 영향 기간:{" "}
                    {result.time_horizon ?? "N/A"}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* 시장별 영향 */}
          {result.impact &&
            Object.keys(result.impact).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">시장별 영향</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {Object.entries(result.impact).map(
                      ([key, val]) => {
                        const nameMap: Record<string, string> = {
                          stock_market: "주식시장",
                          bond_market: "채권시장",
                          fx_market: "환율시장",
                          commodities: "원자재",
                        };
                        return (
                          <div key={key} className="rounded-lg border p-3">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {nameMap[key] ?? key}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {val.magnitude}
                              </Badge>
                            </div>
                            <p
                              className={`text-sm font-medium ${directionColor[val.direction] ?? ""}`}
                            >
                              {val.direction === "POSITIVE"
                                ? "긍정적"
                                : val.direction === "NEGATIVE"
                                  ? "부정적"
                                  : "중립적"}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs">
                              {val.description}
                            </p>
                          </div>
                        );
                      },
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* 추천 행동 */}
          {result.recommended_actions &&
            result.recommended_actions.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">추천 행동</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {result.recommended_actions.map((action, i) => (
                      <li key={i}>{action}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
        </div>
      )}
    </div>
  );
}
