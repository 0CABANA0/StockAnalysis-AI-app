"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getEtfDetail } from "@/lib/api/etf";
import type { EtfFundMaster } from "@/types";
import { LineChart } from "lucide-react";

export function EtfDetailContent({ ticker }: { ticker: string }) {
  const [etf, setEtf] = useState<EtfFundMaster | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEtfDetail(ticker)
      .then(setEtf)
      .catch(() => setEtf(null))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!etf) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center p-12 text-center">
          <LineChart className="text-muted-foreground mb-3 size-12" />
          <p className="font-semibold">ETF 정보를 찾을 수 없습니다</p>
          <Link href="/etf" className="text-primary mt-2 text-sm hover:underline">
            ETF 목록으로 돌아가기
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{etf.name}</CardTitle>
            <Badge variant="outline">{etf.asset_type}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">티커</span>
                <span className="font-medium">{etf.ticker}</span>
              </div>
              {etf.category && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">카테고리</span>
                  <span className="font-medium">{etf.category}</span>
                </div>
              )}
              {etf.benchmark && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">벤치마크</span>
                  <span className="font-medium">{etf.benchmark}</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {etf.ter != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">총 보수(TER)</span>
                  <span className="font-medium">{etf.ter}%</span>
                </div>
              )}
              {etf.nav != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">기준가(NAV)</span>
                  <span className="font-medium">
                    {etf.nav.toLocaleString()}원
                  </span>
                </div>
              )}
              {etf.aum != null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">순자산(AUM)</span>
                  <span className="font-medium">
                    {etf.aum >= 1_000_000_000
                      ? `${(etf.aum / 1_000_000_000).toFixed(1)}조원`
                      : etf.aum >= 100_000_000
                        ? `${(etf.aum / 100_000_000).toFixed(0)}억원`
                        : `${etf.aum.toLocaleString()}원`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 차트 링크 */}
      <Card>
        <CardContent className="p-4">
          <Link
            href={`/chart/${etf.ticker}`}
            className="text-primary flex items-center gap-2 text-sm hover:underline"
          >
            <LineChart className="size-4" />
            {etf.ticker} 차트 보기
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
