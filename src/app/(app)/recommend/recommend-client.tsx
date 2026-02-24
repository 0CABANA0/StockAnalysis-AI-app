"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { getActiveRecommendations } from "@/lib/api/recommendation";
import type { Recommendation } from "@/types";
import { TrendingUp, TrendingDown, Target } from "lucide-react";

export function RecommendContent() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    getActiveRecommendations({ limit: 50 })
      .then((res) => setItems(res.recommendations))
      .catch(() => {
        setItems([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [retryKey]);

  if (loading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="종목 추천 데이터를 불러올 수 없습니다."
        onRetry={() => {
          setError(false);
          setLoading(true);
          setRetryKey((k) => k + 1);
        }}
      />
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center p-12 text-center">
          <Target className="text-muted-foreground mb-3 size-12" />
          <p className="font-semibold">아직 추천 종목이 없습니다</p>
          <p className="text-muted-foreground mt-1 text-sm">
            관리자가 스크리닝을 실행하면 추천 종목이 표시됩니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((rec) => (
        <Link key={rec.id} href={`/guide/${rec.ticker}`}>
          <Card className="hover:bg-accent/50 h-full transition-colors">
            <CardContent className="p-4">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{rec.company_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {rec.ticker}
                  </Badge>
                  {rec.market && (
                    <Badge variant="secondary" className="text-xs">
                      {rec.market}
                    </Badge>
                  )}
                </div>
                {rec.confidence_score != null && (
                  <span className="text-xs font-medium">
                    신뢰도 {Math.round(rec.confidence_score)}%
                  </span>
                )}
              </div>
              {rec.reason && (
                <p className="text-muted-foreground mb-2 line-clamp-2 text-xs">
                  {rec.reason}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs">
                {rec.target_price != null && (
                  <span className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="size-3" />
                    목표 {rec.target_price.toLocaleString()}
                  </span>
                )}
                {rec.stop_loss != null && (
                  <span className="flex items-center gap-1 text-red-600">
                    <TrendingDown className="size-3" />
                    손절 {rec.stop_loss.toLocaleString()}
                  </span>
                )}
                {rec.strategy && (
                  <Badge variant="outline" className="text-xs">
                    {rec.strategy}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
