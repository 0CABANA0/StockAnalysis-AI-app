"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";

interface MacroSnapshot {
  id: string;
  snapshot_data: {
    indices?: Record<string, number | null>;
    exchange_rates?: Record<string, number | null>;
    commodities?: Record<string, number | null>;
    rates_and_fear?: Record<string, number | null>;
  };
  collected_at: string;
}

interface MacroHistoryResponse {
  snapshots: MacroSnapshot[];
  total: number;
}

// 지표 ID → 데이터 경로 매핑
const indicatorMap: Record<string, { label: string; category: string; key: string; unit?: string }> = {
  sp500: { label: "S&P 500", category: "indices", key: "sp500" },
  nasdaq: { label: "나스닥", category: "indices", key: "nasdaq" },
  kospi: { label: "코스피", category: "indices", key: "kospi" },
  nikkei: { label: "닛케이 225", category: "indices", key: "nikkei" },
  shanghai: { label: "상하이 종합", category: "indices", key: "shanghai" },
  usd_krw: { label: "원/달러 환율", category: "exchange_rates", key: "usd_krw", unit: "원" },
  usd_jpy: { label: "엔/달러 환율", category: "exchange_rates", key: "usd_jpy", unit: "엔" },
  eur_usd: { label: "유로/달러 환율", category: "exchange_rates", key: "eur_usd" },
  cny_krw: { label: "위안/원 환율", category: "exchange_rates", key: "cny_krw", unit: "원" },
  wti: { label: "WTI 원유", category: "commodities", key: "wti", unit: "$" },
  gold: { label: "금", category: "commodities", key: "gold", unit: "$" },
  copper: { label: "구리", category: "commodities", key: "copper", unit: "$" },
  natural_gas: { label: "천연가스", category: "commodities", key: "natural_gas", unit: "$" },
  us_10y_yield: { label: "미 10년 국채 수익률", category: "rates_and_fear", key: "us_10y_yield", unit: "%" },
  vix: { label: "VIX 공포지수", category: "rates_and_fear", key: "vix" },
};

function extractValue(snapshot: MacroSnapshot, category: string, key: string): number | null {
  const sd = snapshot.snapshot_data;
  const catData = sd[category as keyof typeof sd] as Record<string, number | null> | undefined;
  return catData?.[key] ?? null;
}

export function IndicatorContent({ indicatorId }: { indicatorId: string }) {
  const [history, setHistory] = useState<MacroSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const indicator = indicatorMap[indicatorId];

  useEffect(() => {
    apiFetch<MacroHistoryResponse>("/macro/history?limit=30")
      .then((res) => setHistory(res.snapshots))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!indicator) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground text-sm">
            알 수 없는 지표입니다: {indicatorId}
          </p>
        </CardContent>
      </Card>
    );
  }

  // 현재값
  const latest = history.length > 0 ? history[0] : null;
  const currentValue = latest
    ? extractValue(latest, indicator.category, indicator.key)
    : null;

  // 이전값 (변동 계산)
  const prev = history.length > 1 ? history[1] : null;
  const prevValue = prev
    ? extractValue(prev, indicator.category, indicator.key)
    : null;

  const change =
    currentValue != null && prevValue != null
      ? currentValue - prevValue
      : null;
  const changePct =
    change != null && prevValue != null && prevValue !== 0
      ? (change / prevValue) * 100
      : null;

  return (
    <div className="space-y-4">
      {/* 현재 값 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{indicator.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">
              {currentValue != null
                ? `${indicator.unit === "$" ? "$" : ""}${currentValue.toLocaleString()}${indicator.unit && indicator.unit !== "$" ? indicator.unit : ""}`
                : "—"}
            </span>
            {change != null && (
              <span
                className={`text-sm font-medium ${
                  change > 0
                    ? "text-green-600"
                    : change < 0
                      ? "text-red-600"
                      : "text-gray-500"
                }`}
              >
                {change > 0 ? "+" : ""}
                {change.toFixed(2)}
                {changePct != null && ` (${changePct > 0 ? "+" : ""}${changePct.toFixed(2)}%)`}
              </span>
            )}
          </div>
          {latest && (
            <p className="text-muted-foreground mt-2 text-xs">
              최종 수집: {new Date(latest.collected_at).toLocaleString("ko-KR")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 히스토리 테이블 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">최근 이력</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              수집된 데이터가 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 20).map((snap) => {
                const val = extractValue(snap, indicator.category, indicator.key);
                return (
                  <div
                    key={snap.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {new Date(snap.collected_at).toLocaleDateString("ko-KR", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="font-medium font-mono">
                      {val != null
                        ? `${indicator.unit === "$" ? "$" : ""}${val.toLocaleString()}${indicator.unit && indicator.unit !== "$" ? indicator.unit : ""}`
                        : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
