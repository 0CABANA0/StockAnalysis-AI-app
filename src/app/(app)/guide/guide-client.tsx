"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { CausalChain } from "@/components/guide/causal-chain";
import { getTodayGuide } from "@/lib/api/guide";
import type { TodayGuideResponse } from "@/lib/api/guide";
import { TrendingUp } from "lucide-react";

const actionColorMap: Record<string, string> = {
  BUY: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  SELL: "bg-red-500/15 text-red-700 dark:text-red-400",
  HOLD: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  WATCH: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  AVOID: "bg-muted text-muted-foreground",
};

const actionLabelMap: Record<string, string> = {
  BUY: "매수",
  SELL: "매도",
  HOLD: "홀딩",
  WATCH: "관망",
  AVOID: "회피",
};

export function GuideContent() {
  const [guide, setGuide] = useState<TodayGuideResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    getTodayGuide()
      .then(setGuide)
      .catch(() => {
        setGuide(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [retryKey]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="투자 가이드를 불러올 수 없습니다."
        onRetry={() => {
          setError(false);
          setLoading(true);
          setRetryKey((k) => k + 1);
        }}
      />
    );
  }

  if (!guide || (!guide.market_summary && guide.action_cards.length === 0)) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <TrendingUp className="text-muted-foreground mb-3 size-12" />
          <h3 className="font-semibold">가이드 준비 중</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            스케줄러가 매일 09:30 KST에 가이드를 자동 생성합니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 시장 요약 */}
      {guide.market_summary && (
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-2 font-semibold">시장 현황</h3>
            <p className="text-sm leading-relaxed">{guide.market_summary}</p>
          </CardContent>
        </Card>
      )}

      {guide.geo_summary && (
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-2 font-semibold">지정학 요약</h3>
            <p className="text-sm leading-relaxed">{guide.geo_summary}</p>
          </CardContent>
        </Card>
      )}

      {/* 시장 인과관계 체인 */}
      <CausalChain
        steps={guide.market_causal_chain}
        title="오늘의 시장 인과관계"
      />

      {/* 액션 카드 */}
      {guide.action_cards.length > 0 && (
        <div>
          <h3 className="mb-2 font-semibold">오늘의 액션</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {guide.action_cards.map((card) => (
              <Link key={card.ticker} href={`/guide/${card.ticker}`}>
                <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <span className="font-medium">{card.company_name}</span>
                        <p className="text-muted-foreground text-xs">
                          {card.ticker}
                        </p>
                      </div>
                      <Badge className={actionColorMap[card.action] ?? ""}>
                        {actionLabelMap[card.action] ?? card.action}
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed">{card.reason}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 주요 이벤트 */}
      {guide.key_events.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="mb-2 font-semibold">주요 이벤트</h3>
            <div className="space-y-2">
              {guide.key_events.map((ev, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground w-12 shrink-0">
                    {ev.time}
                  </span>
                  <span className="flex-1">{ev.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {ev.importance}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
