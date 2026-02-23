"use client";

import { useEffect, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchQuote, type StockQuote } from "@/lib/api/stock";

interface QuoteCardProps {
  ticker: string;
  companyName?: string;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

export function QuoteCard({ ticker, companyName }: QuoteCardProps) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetchQuote(ticker);
        if (!cancelled) setQuote(res);
      } catch {
        // 실패 시 빈 상태 유지
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="flex items-center gap-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (!quote || quote.price === null) {
    return (
      <Card className="mb-6">
        <CardContent>
          <p className="text-muted-foreground text-sm">
            현재가 정보를 불러올 수 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isPositive = (quote.change ?? 0) >= 0;
  const changeColor = isPositive ? "text-green-600" : "text-red-600";

  return (
    <Card className="mb-6">
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {/* 가격 */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">
            {quote.price.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          {companyName && (
            <span className="text-muted-foreground text-sm">
              {companyName}
            </span>
          )}
        </div>

        {/* 변동 */}
        <div className={`flex items-center gap-1 text-sm font-medium ${changeColor}`}>
          {isPositive ? (
            <TrendingUp className="size-4" />
          ) : (
            <TrendingDown className="size-4" />
          )}
          <span>
            {isPositive ? "+" : ""}
            {quote.change?.toFixed(2) ?? "-"}
          </span>
          <span>
            ({isPositive ? "+" : ""}
            {quote.change_percent?.toFixed(2) ?? "-"}%)
          </span>
        </div>

        {/* 거래량 */}
        {quote.volume !== null && (
          <div className="text-muted-foreground text-sm">
            거래량 {formatVolume(quote.volume)}
          </div>
        )}

        {/* 데이터 시각 */}
        {quote.fetched_at && (
          <div className="text-muted-foreground ml-auto text-xs">
            {new Date(quote.fetched_at).toLocaleString("ko-KR")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
