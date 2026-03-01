"use client";

import { useState, useRef } from "react";
import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { runSimulation, runPortfolioSimulation } from "@/lib/api/simulator";
import type {
  PortfolioHolding,
  PortfolioHoldingImpact,
  PortfolioSimResult,
} from "@/lib/api/simulator";
import {
  ArrowLeft,
  Briefcase,
  ImageIcon,
  Loader2,
  TrendingDown,
  TrendingUp,
  Upload,
} from "lucide-react";

/* ── 시나리오 정의 ── */

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

/* ── 색상/라벨 맵 ── */

const directionColor: Record<string, string> = {
  POSITIVE: "text-green-600",
  NEGATIVE: "text-red-600",
  NEUTRAL: "text-yellow-600",
};

const actionColor: Record<string, string> = {
  매수확대: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  보유유지: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  비중축소: "bg-orange-500/15 text-orange-700 dark:text-orange-400",
  즉시매도: "bg-red-500/15 text-red-700 dark:text-red-400",
};

const magnitudeLabel: Record<string, string> = {
  HIGH: "강",
  MEDIUM: "중",
  LOW: "약",
};

const marketName: Record<string, string> = {
  stock_market: "주식시장",
  bond_market: "채권시장",
  fx_market: "환율시장",
  commodities: "원자재",
};

/* ── 일반 시뮬레이션 결과 타입 ── */

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

type Mode = "general" | "portfolio";

/* ══════════════════════════════════════════════ */
/*  SimulatorContent                              */
/* ══════════════════════════════════════════════ */

export function SimulatorContent() {
  /* ── 공통 상태 ── */
  const [mode, setMode] = useState<Mode | null>(null);
  const [selectedScenario, setSelectedScenario] =
    useState<ScenarioOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ── 일반 시뮬레이션 ── */
  const [generalResult, setGeneralResult] = useState<SimResult | null>(null);

  /* ── 포트폴리오 시뮬레이션 ── */
  const [preview, setPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [holdings, setHoldings] = useState<PortfolioHolding[] | null>(null);
  const [portfolioResult, setPortfolioResult] =
    useState<PortfolioSimResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── 초기화 ── */
  const resetAll = () => {
    setMode(null);
    setSelectedScenario(null);
    setLoading(false);
    setError(null);
    setGeneralResult(null);
    setPreview(null);
    setExtracting(false);
    setHoldings(null);
    setPortfolioResult(null);
  };

  /* ── 일반 시뮬레이션 실행 ── */
  const handleGeneralRun = async (scenario: ScenarioOption) => {
    setSelectedScenario(scenario);
    setGeneralResult(null);
    setLoading(true);
    setError(null);
    try {
      const res = await runSimulation({
        scenario_type: scenario.type,
        params: scenario.params,
      });
      setGeneralResult(res.result as SimResult);
    } catch {
      setError("시뮬레이션 실행에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  /* ── 이미지 업로드 → OCR ── */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("JPEG, PNG, WebP 이미지만 지원합니다.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("이미지 크기가 10MB를 초과합니다.");
      return;
    }

    setError(null);
    setHoldings(null);
    setPortfolioResult(null);
    setSelectedScenario(null);
    setExtracting(true);

    // 미리보기
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Base64
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    const base64 = btoa(binary);

    try {
      // 첫 번째 시나리오(RATE_HIKE)로 OCR + 시뮬레이션 동시 호출하지 않음
      // OCR만 수행 — 종목 추출 후 사용자가 시나리오 선택
      const res = await runPortfolioSimulation({
        scenario_type: "RATE_HIKE",
        params: { rate_change: 25 },
        image_data: base64,
        media_type: file.type,
      });
      setHoldings(res.holdings ?? []);
      // 첫 OCR 시 기본 시나리오 결과도 함께 받음
      setPortfolioResult(res.result);
      setSelectedScenario(scenarios[0]);
    } catch {
      setError(
        "이미지에서 종목을 추출할 수 없습니다. 다른 이미지를 시도해 주세요.",
      );
    } finally {
      setExtracting(false);
    }
  };

  /* ── 포트폴리오 시나리오 변경 (캐싱된 holdings 재사용) ── */
  const handlePortfolioRun = async (scenario: ScenarioOption) => {
    if (!holdings || holdings.length === 0) return;
    setSelectedScenario(scenario);
    setPortfolioResult(null);
    setLoading(true);
    setError(null);
    try {
      const res = await runPortfolioSimulation({
        scenario_type: scenario.type,
        params: scenario.params,
        holdings,
      });
      setPortfolioResult(res.result);
    } catch {
      setError("시뮬레이션 실행에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  /* ══════════════════════════════════════════ */
  /*  렌더링                                     */
  /* ══════════════════════════════════════════ */

  /* ── 모드 선택 (초기 화면) ── */
  if (!mode) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground text-sm">
          시뮬레이션 방식을 선택하세요.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            className="hover:border-primary/50 cursor-pointer transition-colors"
            onClick={() => setMode("general")}
          >
            <CardContent className="flex flex-col items-center gap-3 p-8">
              <Briefcase className="text-primary size-10" />
              <p className="text-lg font-semibold">시장 시나리오</p>
              <p className="text-muted-foreground text-center text-sm">
                금리, 환율, 지정학 등 거시 시나리오를 선택하여 시장 전반에 대한
                영향을 분석합니다.
              </p>
            </CardContent>
          </Card>
          <Card
            className="hover:border-primary/50 cursor-pointer transition-colors"
            onClick={() => setMode("portfolio")}
          >
            <CardContent className="flex flex-col items-center gap-3 p-8">
              <ImageIcon className="text-primary size-10" />
              <p className="text-lg font-semibold">내 포트폴리오 시뮬레이션</p>
              <p className="text-muted-foreground text-center text-sm">
                보유 종목 스크린샷을 업로드하면 종목별로 시나리오 영향을 분석해
                드립니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 */}
      <Button variant="ghost" size="sm" onClick={resetAll}>
        <ArrowLeft className="size-4" />
        모드 선택
      </Button>

      {/* ════════════════════════════════════ */}
      {/* 일반 시나리오 모드                     */}
      {/* ════════════════════════════════════ */}
      {mode === "general" && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {scenarios.map((s) => (
              <Card
                key={s.type}
                className={`cursor-pointer transition-colors ${
                  selectedScenario?.type === s.type
                    ? "border-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => handleGeneralRun(s)}
              >
                <CardContent className="p-4">
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-muted-foreground mt-1 text-sm">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {loading && <LoadingCard />}

          {error && <ErrorCard message={error} />}

          {generalResult && !loading && (
            <GeneralResultView result={generalResult} />
          )}
        </>
      )}

      {/* ════════════════════════════════════ */}
      {/* 포트폴리오 모드                        */}
      {/* ════════════════════════════════════ */}
      {mode === "portfolio" && (
        <>
          {/* Step 1: 이미지 업로드 */}
          <Card>
            <CardContent className="p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-muted-foreground/30 hover:border-primary flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed p-8 transition-colors"
              >
                {preview ? (
                  <Image
                    src={preview}
                    alt="포트폴리오 미리보기"
                    width={400}
                    height={192}
                    className="mb-3 max-h-48 rounded-lg object-contain"
                    unoptimized
                  />
                ) : (
                  <Upload className="text-muted-foreground mb-3 size-10" />
                )}
                <p className="font-semibold">
                  {extracting
                    ? "종목 추출 중..."
                    : "보유 종목 스크린샷을 업로드하세요"}
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  증권사 앱의 보유 종목 화면을 캡처해 주세요 (JPEG, PNG, WebP /
                  최대 10MB)
                </p>
              </div>
              {extracting && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  <span className="text-sm">
                    AI가 보유 종목을 인식하고 있습니다...
                  </span>
                </div>
              )}
              {error && !holdings && (
                <p className="mt-3 text-center text-sm text-red-600">{error}</p>
              )}
            </CardContent>
          </Card>

          {/* Step 2: 추출된 종목 + 시나리오 선택 */}
          {holdings && holdings.length > 0 && (
            <>
              {/* 인식된 종목 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    인식된 보유 종목 ({holdings.length}건)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {holdings.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{h.name}</span>
                            {h.ticker && (
                              <Badge variant="outline" className="text-xs">
                                {h.ticker}
                              </Badge>
                            )}
                          </div>
                          {h.quantity != null && (
                            <p className="text-muted-foreground text-xs">
                              {h.quantity}주
                              {h.avg_price != null &&
                                ` · 평균 ${h.avg_price.toLocaleString()}원`}
                            </p>
                          )}
                        </div>
                        {h.profit_loss_rate != null && (
                          <span
                            className={`text-sm font-medium ${
                              h.profit_loss_rate >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {h.profit_loss_rate > 0 ? "+" : ""}
                            {h.profit_loss_rate.toFixed(2)}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 시나리오 선택 */}
              <div>
                <h3 className="mb-3 text-sm font-semibold">
                  시나리오를 선택하세요
                </h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {scenarios.map((s) => (
                    <Card
                      key={s.type}
                      className={`cursor-pointer transition-colors ${
                        selectedScenario?.type === s.type
                          ? "border-primary"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => handlePortfolioRun(s)}
                    >
                      <CardContent className="p-3">
                        <p className="text-sm font-semibold">{s.title}</p>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          {s.desc}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {loading && <LoadingCard />}
              {error && holdings && <ErrorCard message={error} />}

              {/* 포트폴리오 시뮬레이션 결과 */}
              {portfolioResult && !loading && (
                <PortfolioResultView result={portfolioResult} />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*  공통 하위 컴포넌트                              */
/* ══════════════════════════════════════════════ */

function LoadingCard() {
  return (
    <Card>
      <CardContent className="flex items-center justify-center gap-3 p-8">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm">AI 분석 중...</span>
      </CardContent>
    </Card>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-center text-sm text-red-600">{message}</p>
      </CardContent>
    </Card>
  );
}

/* ── 시장별 영향 공통 렌더러 ── */

function MarketImpactGrid({
  impact,
}: {
  impact: Record<string, ImpactDetail>;
}) {
  if (Object.keys(impact).length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">시장별 영향</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {Object.entries(impact).map(([key, val]) => (
            <div key={key} className="rounded-lg border p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {marketName[key] ?? key}
                </span>
                <Badge variant="outline" className="text-xs">
                  {magnitudeLabel[val.magnitude] ?? val.magnitude}
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── 일반 시뮬레이션 결과 ── */

function GeneralResultView({ result }: { result: SimResult }) {
  return (
    <div className="space-y-4">
      {result.summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">분석 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{result.summary}</p>
            {result.probability && (
              <p className="text-muted-foreground mt-2 text-xs">
                발생 확률: {result.probability} | 영향 기간:{" "}
                {result.time_horizon ?? "N/A"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {result.impact && <MarketImpactGrid impact={result.impact} />}

      {result.affected_sectors && result.affected_sectors.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">영향 섹터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.affected_sectors.map((s, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-sm font-medium">{s.sector}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        s.impact === "수혜" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {s.impact}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">{s.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {result.recommended_actions && result.recommended_actions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">추천 행동</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm">
              {result.recommended_actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ── 포트폴리오 시뮬레이션 결과 ── */

function PortfolioResultView({ result }: { result: PortfolioSimResult }) {
  return (
    <div className="space-y-4">
      {/* 요약 */}
      {result.summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">포트폴리오 영향 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{result.summary}</p>
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
      {result.impact && <MarketImpactGrid impact={result.impact} />}

      {/* 종목별 영향 — 핵심 차별점 */}
      {result.portfolio_impact && result.portfolio_impact.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">보유 종목별 영향 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.portfolio_impact.map(
                (item: PortfolioHoldingImpact, i: number) => (
                  <div key={i} className="rounded-lg border p-3">
                    {/* 종목 헤더 */}
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.direction === "POSITIVE" ? (
                          <TrendingUp className="size-4 text-green-600" />
                        ) : item.direction === "NEGATIVE" ? (
                          <TrendingDown className="size-4 text-red-600" />
                        ) : null}
                        <span className="font-medium">{item.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.ticker}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {magnitudeLabel[item.magnitude] ?? item.magnitude}
                        </Badge>
                        <Badge
                          className={`text-xs ${actionColor[item.action] ?? "bg-muted text-muted-foreground"}`}
                        >
                          {item.action}
                        </Badge>
                      </div>
                    </div>
                    {/* 근거 설명 */}
                    <div className="bg-muted/50 rounded-md p-2">
                      <p className="text-muted-foreground text-xs leading-relaxed">
                        {item.reason}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 추천 행동 */}
      {result.recommended_actions && result.recommended_actions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">포트폴리오 전략 제안</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm">
              {result.recommended_actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
