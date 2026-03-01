"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crosshair,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  BarChart3,
  Globe,
  Newspaper,
  DollarSign,
  Shield,
} from "lucide-react";

import {
  analyzePrediction,
  type PredictionScore,
  type SignalBreakdown,
} from "@/lib/api/prediction";

// ─── 헬퍼 ───

const DIRECTION_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  STRONG_BUY: {
    label: "강력 매수",
    color: "bg-green-600 text-white",
    icon: <TrendingUp className="size-4" />,
  },
  BUY: {
    label: "매수",
    color: "bg-green-500 text-white",
    icon: <TrendingUp className="size-4" />,
  },
  HOLD: {
    label: "홀딩",
    color: "bg-yellow-500 text-white",
    icon: <Minus className="size-4" />,
  },
  SELL: {
    label: "매도",
    color: "bg-red-500 text-white",
    icon: <TrendingDown className="size-4" />,
  },
  STRONG_SELL: {
    label: "강력 매도",
    color: "bg-red-700 text-white",
    icon: <TrendingDown className="size-4" />,
  },
};

const RISK_CONFIG: Record<string, { label: string; color: string }> = {
  LOW: { label: "낮음", color: "bg-green-100 text-green-800" },
  MEDIUM: { label: "보통", color: "bg-yellow-100 text-yellow-800" },
  HIGH: { label: "높음", color: "bg-red-100 text-red-800" },
};

const SIGNAL_META = [
  { key: "technical", label: "기술적", icon: BarChart3, weight: 30 },
  { key: "macro", label: "거시경제", icon: TrendingUp, weight: 25 },
  { key: "sentiment", label: "감성", icon: Newspaper, weight: 20 },
  { key: "currency", label: "환율", icon: DollarSign, weight: 15 },
  { key: "geopolitical", label: "지정학", icon: Globe, weight: 10 },
] as const;

type SignalKey = (typeof SIGNAL_META)[number]["key"];

function scoreColor(v: number | null): string {
  if (v == null) return "text-muted-foreground";
  if (v >= 30) return "text-green-600";
  if (v >= -30) return "text-yellow-600";
  return "text-red-600";
}

function formatScore(v: number | null): string {
  if (v == null) return "N/A";
  return v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1);
}

// ─── 컴포넌트 ───

export function PredictionContent() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: PredictionScore;
    breakdown: SignalBreakdown;
  } | null>(null);

  async function handleAnalyze() {
    const t = ticker.trim().toUpperCase();
    if (!t) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await analyzePrediction(t);
      setResult({ score: res.score, breakdown: res.signal_breakdown });
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 검색 영역 */}
      <Card>
        <CardContent className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAnalyze();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="종목 코드 입력 (예: AAPL, 005930.KS)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !ticker.trim()}>
              <Search className="mr-1 size-4" />
              {loading ? "분석 중..." : "분석"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 로딩 */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {/* 에러 */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 p-4">
            <AlertTriangle className="text-destructive size-5" />
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 결과 */}
      {result && <PredictionResult {...result} />}

      {/* 빈 상태 */}
      {!loading && !result && !error && (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center">
            <Crosshair className="text-muted-foreground mb-3 size-12" />
            <p className="font-semibold">종합 스코어링 분석</p>
            <p className="text-muted-foreground mt-1 text-sm">
              종목 코드를 입력하고 분석 버튼을 누르면
              <br />
              5개 시그널 기반 투자 판단을 AI가 생성합니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PredictionResult({
  score,
  breakdown,
}: {
  score: PredictionScore;
  breakdown: SignalBreakdown;
}) {
  const dir = DIRECTION_CONFIG[score.direction] ?? DIRECTION_CONFIG.HOLD;
  const risk = RISK_CONFIG[score.risk_level] ?? RISK_CONFIG.MEDIUM;

  return (
    <div className="space-y-4">
      {/* 종합 판정 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crosshair className="size-4" />
            {score.ticker}
            {score.company_name && (
              <span className="text-muted-foreground text-sm font-normal">
                {score.company_name}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={dir.color}>
              {dir.icon}
              <span className="ml-1">{dir.label}</span>
            </Badge>
            <Badge className={risk.color}>
              <Shield className="mr-1 size-3" />
              리스크: {risk.label}
            </Badge>
            <span className={`text-lg font-bold ${scoreColor(score.short_term_score)}`}>
              {formatScore(score.short_term_score)}점
            </span>
          </div>

          {score.opinion && (
            <p className="bg-muted rounded-lg p-3 text-sm leading-relaxed">
              {score.opinion}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 시그널 분해 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">시그널 분해</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {SIGNAL_META.map(({ key, label, icon: Icon, weight }) => {
              const signalScore = getSignalComposite(breakdown, key);
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {label}{" "}
                        <span className="text-muted-foreground text-xs">
                          ({weight}%)
                        </span>
                      </span>
                      <span
                        className={`text-sm font-bold ${scoreColor(signalScore)}`}
                      >
                        {formatScore(signalScore)}
                      </span>
                    </div>
                    <div className="bg-muted mt-1 h-2 overflow-hidden rounded-full">
                      <div
                        className={`h-full rounded-full transition-all ${signalScore != null && signalScore >= 0 ? "bg-green-500" : "bg-red-500"}`}
                        style={{
                          width: `${Math.min(100, Math.abs(signalScore ?? 0))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI 리포트 */}
      {score.report_text && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">AI 분석 리포트</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {score.report_text}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 시나리오 */}
      {(score.scenario_bull || score.scenario_base || score.scenario_bear) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">시나리오 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              <ScenarioCard
                label="낙관 (Bull)"
                data={score.scenario_bull}
                color="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950"
              />
              <ScenarioCard
                label="기본 (Base)"
                data={score.scenario_base}
                color="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950"
              />
              <ScenarioCard
                label="비관 (Bear)"
                data={score.scenario_bear}
                color="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 분석 시각 */}
      <p className="text-muted-foreground text-right text-xs">
        분석일: {new Date(score.analyzed_at).toLocaleString("ko-KR")}
      </p>
    </div>
  );
}

function ScenarioCard({
  label,
  data,
  color,
}: {
  label: string;
  data: Record<string, string> | null;
  color: string;
}) {
  if (!data) return null;
  return (
    <div className={`rounded-lg border p-3 ${color}`}>
      <p className="mb-1 text-xs font-semibold">{label}</p>
      {Object.entries(data).map(([k, v]) => (
        <p key={k} className="text-xs leading-relaxed">
          <span className="font-medium">{k}:</span> {v}
        </p>
      ))}
    </div>
  );
}

function getSignalComposite(
  breakdown: SignalBreakdown,
  key: SignalKey,
): number {
  return breakdown[key].composite;
}
