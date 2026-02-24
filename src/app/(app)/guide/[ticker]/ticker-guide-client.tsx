"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { QuoteCard } from "@/components/charts/quote-card";
import { IndicatorCards } from "@/components/charts/indicator-cards";
import { DisclaimerBanner } from "@/components/layout/disclaimer-banner";
import { getTickerGuide } from "@/lib/api/guide";
import { cn } from "@/lib/utils";
import type { InvestmentGuide } from "@/types";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  LineChart,
  ShieldAlert,
  Target,
} from "lucide-react";

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

function confidenceBarColor(confidence: number): string {
  if (confidence >= 70) return "bg-green-500";
  if (confidence >= 40) return "bg-yellow-500";
  return "bg-red-500";
}

export function TickerGuideContent({ ticker }: { ticker: string }) {
  const [guide, setGuide] = useState<InvestmentGuide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await getTickerGuide(ticker);
        if (!cancelled) {
          setGuide(res.guide);
          setError(false);
        }
      } catch {
        if (!cancelled) {
          setGuide(null);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    setLoading(true);
    load();
    return () => {
      cancelled = true;
    };
  }, [ticker, retryKey]);

  /* ── 로딩 스켈레톤 ── */
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        {/* 네비게이션 스켈레톤 */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  /* ── 에러 상태 ── */
  if (error) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/guide">
              <ArrowLeft className="size-4" />
              투자 가이드
            </Link>
          </Button>
        </div>
        <ErrorState
          message={`${ticker} 가이드를 불러오는 중 오류가 발생했습니다.`}
          onRetry={() => setRetryKey((k) => k + 1)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* [A] 네비게이션 바 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/guide">
            <ArrowLeft className="size-4" />
            투자 가이드
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/chart/${ticker}`}>
            <LineChart className="size-4" />
            차트 보기
          </Link>
        </Button>
      </div>

      {/* [B] 헤더 */}
      <div>
        <Badge variant="outline" className="mb-2">
          {ticker}
        </Badge>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{ticker} 투자 가이드</h1>
          {guide && (
            <Badge className={actionColorMap[guide.action] ?? ""}>
              {actionLabelMap[guide.action] ?? guide.action}
            </Badge>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-muted-foreground text-sm">
            거시+지정학+기술적 분석 종합 가이드
          </p>
          {guide?.guide_date && (
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Calendar className="size-3" />
              {guide.guide_date}
            </span>
          )}
        </div>
      </div>

      {/* [C] QuoteCard — 가이드 유무와 무관하게 항상 표시 */}
      <QuoteCard ticker={ticker} />

      {!guide ? (
        /* ── 가이드 없음 상태 ── */
        <>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <AlertTriangle className="text-muted-foreground mb-3 size-12" />
              <h3 className="font-semibold">가이드 없음</h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {ticker}에 대한 오늘의 가이드가 아직 생성되지 않았습니다.
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/guide">가이드 목록으로 돌아가기</Link>
              </Button>
            </CardContent>
          </Card>

          {/* 기술적 지표는 가이드 없어도 표시 */}
          <IndicatorCards ticker={ticker} />
          <DisclaimerBanner />
        </>
      ) : (
        /* ── 전체 콘텐츠 ── */
        <>
          {/* [D] 신뢰도 + 목표가/손절가 (2열 그리드) */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* 신뢰도 프로그레스 바 */}
            {guide.confidence != null && (
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-muted-foreground mb-1 text-xs">신뢰도</p>
                    <div className="flex items-center gap-3">
                      <div className="bg-muted h-3 flex-1 overflow-hidden rounded-full">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            confidenceBarColor(guide.confidence * 100),
                          )}
                          style={{
                            width: `${Math.min(guide.confidence * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold">
                        {(guide.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 목표가 */}
            {guide.target_price && (
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Target className="size-5 text-green-500" />
                  <div>
                    <p className="text-muted-foreground text-xs">목표가</p>
                    <p className="text-lg font-bold">
                      {guide.target_price.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 손절가 */}
            {guide.stop_loss && (
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <ShieldAlert className="size-5 text-red-500" />
                  <div>
                    <p className="text-muted-foreground text-xs">손절가</p>
                    <p className="text-lg font-bold">
                      {guide.stop_loss.toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* [E] 3열 분석 카드 */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">거시경제 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {guide.macro_reasoning ?? "분석 데이터 없음"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">지정학 영향</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {guide.geo_reasoning ?? "분석 데이터 없음"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">기술적 지표</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {guide.technical_reasoning ?? "분석 데이터 없음"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* [F] IndicatorCards */}
          <IndicatorCards ticker={ticker} />

          {/* [G] 리스크 태그 + 환율 영향 */}
          {((guide.risk_tags && guide.risk_tags.length > 0) ||
            guide.fx_impact) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">리스크 & 환율 영향</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {guide.risk_tags && guide.risk_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {guide.risk_tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {guide.fx_impact && (
                  <p className="text-muted-foreground text-sm">
                    환율 영향: {guide.fx_impact}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* [H] 종합 리포트 */}
          {guide.full_report_text && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">종합 의견</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {guide.full_report_text}
                </p>
              </CardContent>
            </Card>
          )}

          {/* [I] 면책 문구 */}
          <DisclaimerBanner />
        </>
      )}
    </div>
  );
}
