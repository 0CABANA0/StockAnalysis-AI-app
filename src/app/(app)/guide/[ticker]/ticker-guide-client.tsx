"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getTickerGuide } from "@/lib/api/guide";
import type { InvestmentGuide } from "@/types";
import { AlertTriangle, Target, ShieldAlert } from "lucide-react";

const actionColorMap: Record<string, string> = {
  BUY: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  SELL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  HOLD: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  WATCH: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  AVOID: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const actionLabelMap: Record<string, string> = {
  BUY: "매수",
  SELL: "매도",
  HOLD: "홀딩",
  WATCH: "관망",
  AVOID: "회피",
};

export function TickerGuideContent({ ticker }: { ticker: string }) {
  const [guide, setGuide] = useState<InvestmentGuide | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTickerGuide(ticker)
      .then((res) => setGuide(res.guide))
      .catch(() => setGuide(null))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <Badge variant="outline" className="mb-2">
          {ticker}
        </Badge>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{ticker} 투자 가이드</h1>
          {guide && (
            <Badge className={actionColorMap[guide.action] ?? ""}>
              {actionLabelMap[guide.action] ?? guide.action}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          거시+지정학+기술적 분석 종합 가이드
        </p>
      </div>

      {!guide ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <AlertTriangle className="text-muted-foreground mb-3 size-12" />
            <h3 className="font-semibold">가이드 없음</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {ticker}에 대한 오늘의 가이드가 아직 생성되지 않았습니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* 3열 분석 카드 */}
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

          {/* 목표가/손절가 */}
          {(guide.target_price || guide.stop_loss) && (
            <div className="grid gap-4 md:grid-cols-2">
              {guide.target_price && (
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Target className="size-5 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">목표가</p>
                      <p className="text-lg font-bold">
                        {guide.target_price.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {guide.stop_loss && (
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <ShieldAlert className="size-5 text-red-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">손절가</p>
                      <p className="text-lg font-bold">
                        {guide.stop_loss.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* 리스크 태그 */}
          {guide.risk_tags && guide.risk_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {guide.risk_tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* 종합 리포트 */}
          {guide.full_report_text && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">종합 의견</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {guide.full_report_text}
                </p>
                {guide.fx_impact && (
                  <p className="text-muted-foreground mt-2 text-xs">
                    환율 영향: {guide.fx_impact}
                  </p>
                )}
                {guide.confidence != null && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    신뢰도: {(guide.confidence * 100).toFixed(0)}%
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
