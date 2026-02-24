"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { getFearGreed } from "@/lib/api/fear-greed";
import type { FearGreedSnapshot } from "@/types";

const labelMap: Record<string, string> = {
  EXTREME_FEAR: "극단적 공포",
  FEAR: "공포",
  NEUTRAL: "중립",
  GREED: "탐욕",
  EXTREME_GREED: "극단적 탐욕",
};

const colorMap: Record<string, string> = {
  EXTREME_FEAR: "border-red-600 text-red-600",
  FEAR: "border-orange-500 text-orange-500",
  NEUTRAL: "border-yellow-400 text-yellow-500",
  GREED: "border-green-500 text-green-500",
  EXTREME_GREED: "border-green-600 text-green-600",
};

export function FearGreedContent() {
  const [current, setCurrent] = useState<FearGreedSnapshot | null>(null);
  const [history, setHistory] = useState<FearGreedSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    getFearGreed(30)
      .then((res) => {
        setCurrent(res.current);
        setHistory(res.history);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [retryKey]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="mx-auto h-48 w-48 rounded-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="공포/탐욕 지수를 불러올 수 없습니다."
        onRetry={() => {
          setError(false);
          setLoading(true);
          setRetryKey((k) => k + 1);
        }}
      />
    );
  }

  const value = current?.index_value ?? null;
  const label = current?.label ?? "NEUTRAL";
  const borderColor = colorMap[label] ?? "border-yellow-400 text-yellow-500";
  const components = (current?.components ?? {}) as Record<
    string,
    { value: number; label: string }
  >;

  return (
    <div className="space-y-6">
      {/* 게이지 */}
      <Card>
        <CardContent className="flex flex-col items-center p-12">
          <div
            className={`relative flex size-40 items-center justify-center rounded-full border-8 ${borderColor}`}
          >
            <div className="text-center">
              <p className="text-4xl font-bold">
                {value != null ? value : "—"}
              </p>
              <p className="text-sm">{labelMap[label] ?? "데이터 대기"}</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            0 극단적 공포 ← → 100 극단적 탐욕
          </p>
        </CardContent>
      </Card>

      {/* 컴포넌트 분해 */}
      {Object.keys(components).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">지수 구성 요소</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(components).map(([key, comp]) => {
                const nameMap: Record<string, string> = {
                  vix: "VIX (변동성)",
                  momentum: "모멘텀 (S&P500)",
                  sentiment: "뉴스 감성",
                  safe_haven: "안전자산 (금)",
                };
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="text-sm font-medium">
                      {nameMap[key] ?? key}
                    </span>
                    <div className="text-right">
                      <span className="text-lg font-bold">{comp.value}</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {labelMap[comp.label] ?? comp.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 이력 */}
      {history.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">최근 이력</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.slice(0, 10).map((snap, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {new Date(snap.snapshot_at).toLocaleDateString("ko-KR")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{snap.index_value}</span>
                    <span className="text-muted-foreground text-xs">
                      {labelMap[snap.label] ?? snap.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
