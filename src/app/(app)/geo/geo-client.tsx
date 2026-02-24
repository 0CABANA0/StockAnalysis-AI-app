"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { getGeoRisks } from "@/lib/api/geo";
import type { GeopoliticalRisk } from "@/types";

const levelColor: Record<string, string> = {
  LOW: "bg-emerald-500",
  MODERATE: "bg-amber-400",
  HIGH: "bg-orange-500",
  CRITICAL: "bg-red-500",
};

const levelLabel: Record<string, string> = {
  LOW: "낮음",
  MODERATE: "보통",
  HIGH: "높음",
  CRITICAL: "매우 높음",
};

export function GeoRisksList() {
  const [risks, setRisks] = useState<GeopoliticalRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    getGeoRisks()
      .then((res) => setRisks(res.risks))
      .catch(() => {
        setRisks([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [retryKey]);

  if (loading) {
    return (
      <div className="grid gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="지정학 리스크 데이터를 불러올 수 없습니다."
        onRetry={() => {
          setError(false);
          setLoading(true);
          setRetryKey((k) => k + 1);
        }}
      />
    );
  }

  if (risks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground text-sm">
            등록된 지정학 리스크가 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {risks.map((risk) => (
        <Link key={risk.risk_id} href={`/geo/${risk.risk_id}`}>
          <Card className="hover:bg-accent/50 transition-colors">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-block size-3 rounded-full ${levelColor[risk.risk_level] ?? "bg-gray-400"}`}
                />
                <div>
                  <span className="text-sm font-medium">{risk.title}</span>
                  {risk.description && (
                    <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                      {risk.description}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant="outline">
                {levelLabel[risk.risk_level] ?? risk.risk_level}
              </Badge>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
