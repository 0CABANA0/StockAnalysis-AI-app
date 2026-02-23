import { FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import type { PredictionScore } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  return { title: `${ticker} AI 리포트 | StockAnalysis AI` };
}

const directionConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "destructive" | "secondary";
    icon: typeof TrendingUp;
  }
> = {
  BULLISH: { label: "강세", variant: "default", icon: TrendingUp },
  BEARISH: { label: "약세", variant: "destructive", icon: TrendingDown },
  NEUTRAL: { label: "중립", variant: "secondary", icon: Minus },
};

const riskConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: "낮음", className: "text-green-600" },
  MEDIUM: { label: "보통", className: "text-yellow-600" },
  HIGH: { label: "높음", className: "text-red-600" },
};

function ScoreBar({
  label,
  score,
  weight,
}: {
  label: string;
  score: number | null;
  weight: string;
}) {
  const value = score ?? 0;
  const percentage = Math.max(0, Math.min(100, value));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>
          {label}{" "}
          <span className="text-muted-foreground text-xs">({weight})</span>
        </span>
        <span className="font-mono font-medium">
          {score !== null ? score.toFixed(1) : "-"}
        </span>
      </div>
      <div className="bg-muted h-2 rounded-full">
        <div
          className="h-2 rounded-full bg-blue-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const decodedTicker = decodeURIComponent(ticker).toUpperCase();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: score } = await supabase
    .from("prediction_scores")
    .select("*")
    .eq("user_id", user!.id)
    .eq("ticker", decodedTicker)
    .order("analyzed_at", { ascending: false })
    .limit(1)
    .returns<PredictionScore[]>()
    .maybeSingle();

  const dir = directionConfig[score?.direction ?? "NEUTRAL"];
  const risk = riskConfig[score?.risk_level ?? "LOW"];
  const DirIcon = dir.icon;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{decodedTicker} AI 리포트</h1>
            {score && (
              <>
                <Badge variant={dir.variant}>
                  <DirIcon className="mr-1 size-3" />
                  {dir.label}
                </Badge>
                <span className={`text-sm font-medium ${risk.className}`}>
                  리스크: {risk.label}
                </span>
              </>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            기술/거시/감성/환율/지정학 가중 통합 분석 결과
          </p>
          {score && (
            <p className="text-muted-foreground mt-1 text-xs">
              분석일: {new Date(score.analyzed_at).toLocaleString("ko-KR")}
            </p>
          )}
        </div>

        {!score ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
              <FileText className="text-muted-foreground size-8" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">분석 결과가 없습니다</h3>
            <p className="text-muted-foreground text-sm">
              {decodedTicker}에 대한 AI 분석이 수행되면 리포트가 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* 통합 스코어 */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">통합 스코어</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6 text-center">
                  <div className="text-4xl font-bold">
                    {score.short_term_score.toFixed(1)}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    단기 전망 점수
                  </p>
                  {score.medium_term_score !== null && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      중기: {score.medium_term_score.toFixed(1)}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <ScoreBar
                    label="기술적 분석"
                    score={score.technical_score}
                    weight="30%"
                  />
                  <ScoreBar
                    label="거시경제"
                    score={score.macro_score}
                    weight="25%"
                  />
                  <ScoreBar
                    label="감성 분석"
                    score={score.sentiment_score}
                    weight="20%"
                  />
                  <ScoreBar
                    label="환율"
                    score={score.currency_score}
                    weight="15%"
                  />
                  <ScoreBar
                    label="지정학"
                    score={score.geopolitical_score}
                    weight="10%"
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI 의견 + 리포트 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">AI 분석 리포트</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {score.opinion && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">AI 의견</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {score.opinion}
                    </p>
                  </div>
                )}

                {score.report_text && (
                  <div>
                    <h4 className="mb-2 text-sm font-semibold">상세 리포트</h4>
                    <div className="bg-muted/50 text-muted-foreground rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">
                      {score.report_text}
                    </div>
                  </div>
                )}

                {/* 시나리오 */}
                {(score.scenario_bull ||
                  score.scenario_base ||
                  score.scenario_bear) && (
                  <div>
                    <h4 className="mb-3 text-sm font-semibold">
                      시나리오 분석
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {score.scenario_bull && (
                        <div className="rounded-lg border border-green-200 p-3 dark:border-green-800">
                          <div className="mb-1 text-xs font-medium text-green-600">
                            Bull (강세)
                          </div>
                          <p className="text-xs">
                            {JSON.stringify(score.scenario_bull)}
                          </p>
                        </div>
                      )}
                      {score.scenario_base && (
                        <div className="rounded-lg border border-yellow-200 p-3 dark:border-yellow-800">
                          <div className="mb-1 text-xs font-medium text-yellow-600">
                            Base (기본)
                          </div>
                          <p className="text-xs">
                            {JSON.stringify(score.scenario_base)}
                          </p>
                        </div>
                      )}
                      {score.scenario_bear && (
                        <div className="rounded-lg border border-red-200 p-3 dark:border-red-800">
                          <div className="mb-1 text-xs font-medium text-red-600">
                            Bear (약세)
                          </div>
                          <p className="text-xs">
                            {JSON.stringify(score.scenario_bear)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <p className="text-muted-foreground mt-6 text-center text-xs">
          * AI 리포트는 투자 참고용이며, 최종 투자 판단의 책임은 본인에게
          있습니다.
        </p>
      </main>
    </div>
  );
}
