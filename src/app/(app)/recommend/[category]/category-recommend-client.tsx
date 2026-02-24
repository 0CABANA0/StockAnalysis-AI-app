"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getActiveRecommendations } from "@/lib/api/recommendation";
import type { Recommendation } from "@/types";
import { TrendingUp, TrendingDown, Target } from "lucide-react";

const categoryMarketMap: Record<string, string[]> = {
  domestic: ["KOSPI", "KOSDAQ"],
  us: ["NYSE", "NASDAQ"],
  japan: ["JP"],
  europe: ["EU"],
  etf: ["ETF"],
};

export function CategoryRecommendContent({ category }: { category: string }) {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const markets = useMemo(() => categoryMarketMap[category] ?? [], [category]);

  useEffect(() => {
    getActiveRecommendations({ limit: 100 })
      .then((res) => {
        const filtered =
          markets.length > 0
            ? res.recommendations.filter((r) =>
                markets.some((m) => r.market?.toUpperCase().includes(m)),
              )
            : res.recommendations;
        setItems(filtered);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [markets]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center p-12 text-center">
          <Target className="text-muted-foreground mb-3 size-12" />
          <p className="font-semibold">해당 카테고리에 추천 종목이 없습니다</p>
          <p className="text-muted-foreground mt-1 text-sm">
            스크리닝 실행 후 추천 종목이 생성됩니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((rec) => (
        <Link key={rec.id} href={`/guide/${rec.ticker}`}>
          <Card className="hover:bg-accent/50 transition-colors">
            <CardContent className="p-4">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{rec.company_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {rec.ticker}
                  </Badge>
                </div>
                {rec.confidence_score != null && (
                  <Badge
                    variant={rec.confidence_score >= 70 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {Math.round(rec.confidence_score)}점
                  </Badge>
                )}
              </div>
              {rec.reason && (
                <p className="text-muted-foreground mb-2 text-sm">
                  {rec.reason}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs">
                {rec.target_price != null && (
                  <span className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="size-3" />
                    목표가 {rec.target_price.toLocaleString()}
                  </span>
                )}
                {rec.stop_loss != null && (
                  <span className="flex items-center gap-1 text-red-600">
                    <TrendingDown className="size-3" />
                    손절가 {rec.stop_loss.toLocaleString()}
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
