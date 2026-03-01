"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Search, AlertTriangle, X } from "lucide-react";

import {
  analyzePerformance,
  type PerformanceAnalysisResponse,
} from "@/lib/api/performance";

// ─── 헬퍼 ───

const PERIOD_OPTIONS = [
  { value: "6mo", label: "6개월" },
  { value: "1y", label: "1년" },
  { value: "2y", label: "2년" },
  { value: "5y", label: "5년" },
];

function pct(v: number | null): string {
  if (v == null) return "N/A";
  return `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
}

function num(v: number | null, decimals = 2): string {
  if (v == null) return "N/A";
  return v.toFixed(decimals);
}

function metricColor(v: number | null): string {
  if (v == null) return "text-muted-foreground";
  if (v > 0) return "text-green-600";
  if (v < 0) return "text-red-600";
  return "text-muted-foreground";
}

function corrColor(v: number): string {
  if (v >= 0.7) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  if (v >= 0.3) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
}

// ─── 컴포넌트 ───

export function PerformanceContent() {
  const [tickerInput, setTickerInput] = useState("");
  const [tickers, setTickers] = useState<string[]>([]);
  const [period, setPeriod] = useState("1y");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PerformanceAnalysisResponse | null>(
    null,
  );

  function addTicker() {
    const t = tickerInput.trim().toUpperCase();
    if (!t || tickers.includes(t) || tickers.length >= 20) return;
    setTickers([...tickers, t]);
    setTickerInput("");
  }

  function removeTicker(t: string) {
    setTickers(tickers.filter((x) => x !== t));
  }

  async function handleAnalyze() {
    if (tickers.length === 0) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await analyzePerformance(tickers, period);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 입력 영역 */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addTicker();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="종목 코드 추가 (예: SPY, QQQ, 005930.KS)"
              value={tickerInput}
              onChange={(e) => setTickerInput(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={!tickerInput.trim() || tickers.length >= 20}
            >
              추가
            </Button>
          </form>

          {tickers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tickers.map((t) => (
                <Badge key={t} variant="secondary" className="gap-1 pr-1">
                  {t}
                  <button
                    type="button"
                    onClick={() => removeTicker(t)}
                    className="hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {PERIOD_OPTIONS.map((p) => (
              <Button
                key={p.value}
                variant={period === p.value ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </Button>
            ))}
            <Button
              onClick={handleAnalyze}
              disabled={loading || tickers.length === 0}
              className="ml-auto"
            >
              <Search className="mr-1 size-4" />
              {loading ? "분석 중..." : "성과 분석"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 로딩 */}
      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
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
      {result && <PerformanceResult data={result} />}

      {/* 빈 상태 */}
      {!loading && !result && !error && (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center">
            <Activity className="text-muted-foreground mb-3 size-12" />
            <p className="font-semibold">종목 성과 비교 분석</p>
            <p className="text-muted-foreground mt-1 text-sm">
              비교할 종목을 추가하고 기간을 선택하세요.
              <br />
              최대 20개 종목을 동시에 비교할 수 있습니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PerformanceResult({ data }: { data: PerformanceAnalysisResponse }) {
  return (
    <div className="space-y-4">
      {/* 핵심 지표 테이블 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">핵심 성과 지표</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-2 py-1.5 text-left font-medium">종목</th>
                <th className="px-2 py-1.5 text-right font-medium">총 수익률</th>
                <th className="px-2 py-1.5 text-right font-medium">연환산</th>
                <th className="px-2 py-1.5 text-right font-medium">변동성</th>
                <th className="px-2 py-1.5 text-right font-medium">Sharpe</th>
                <th className="px-2 py-1.5 text-right font-medium">MDD</th>
              </tr>
            </thead>
            <tbody>
              {data.metrics.map((m) => (
                <tr key={m.ticker} className="border-b last:border-0">
                  <td className="px-2 py-1.5 font-medium">
                    {m.ticker}
                    {m.name && (
                      <span className="text-muted-foreground ml-1 text-xs">
                        {m.name}
                      </span>
                    )}
                  </td>
                  <td
                    className={`px-2 py-1.5 text-right ${metricColor(m.total_return)}`}
                  >
                    {pct(m.total_return)}
                  </td>
                  <td
                    className={`px-2 py-1.5 text-right ${metricColor(m.annualized_return)}`}
                  >
                    {pct(m.annualized_return)}
                  </td>
                  <td className="text-muted-foreground px-2 py-1.5 text-right">
                    {pct(m.volatility)}
                  </td>
                  <td
                    className={`px-2 py-1.5 text-right ${metricColor(m.sharpe_ratio)}`}
                  >
                    {num(m.sharpe_ratio)}
                  </td>
                  <td className="px-2 py-1.5 text-right text-red-600">
                    {pct(m.mdd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 롤링 수익률 */}
      {data.rolling_returns.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">롤링 수익률</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-1.5 text-left font-medium">종목</th>
                  <th className="px-2 py-1.5 text-right font-medium">1개월</th>
                  <th className="px-2 py-1.5 text-right font-medium">3개월</th>
                  <th className="px-2 py-1.5 text-right font-medium">6개월</th>
                  <th className="px-2 py-1.5 text-right font-medium">12개월</th>
                </tr>
              </thead>
              <tbody>
                {groupRollingByTicker(data.rolling_returns).map(
                  ({ ticker, windows }) => (
                    <tr key={ticker} className="border-b last:border-0">
                      <td className="px-2 py-1.5 font-medium">{ticker}</td>
                      {["1M", "3M", "6M", "12M"].map((w) => {
                        const val = windows[w] ?? null;
                        return (
                          <td
                            key={w}
                            className={`px-2 py-1.5 text-right ${metricColor(val)}`}
                          >
                            {pct(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 상관관계 */}
      {data.correlations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">상관관계 매트릭스</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.correlations.map((c) => (
                <Badge
                  key={`${c.ticker_a}-${c.ticker_b}`}
                  className={corrColor(c.correlation)}
                >
                  {c.ticker_a} ↔ {c.ticker_b}: {num(c.correlation)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-muted-foreground text-right text-xs">
        분석 기간: {data.period} | 분석일:{" "}
        {new Date(data.analyzed_at).toLocaleString("ko-KR")}
      </p>
    </div>
  );
}

// ─── 유틸 ───

interface GroupedRolling {
  ticker: string;
  windows: Record<string, number | null>;
}

function groupRollingByTicker(
  rolling: { ticker: string; window: string; value: number | null }[],
): GroupedRolling[] {
  const map = new Map<string, Record<string, number | null>>();
  for (const r of rolling) {
    if (!map.has(r.ticker)) map.set(r.ticker, {});
    map.get(r.ticker)![r.window] = r.value;
  }
  return Array.from(map.entries()).map(([ticker, windows]) => ({
    ticker,
    windows,
  }));
}
