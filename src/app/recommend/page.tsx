import { Sparkles, TrendingUp } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { RecommendationsTable } from "@/components/recommend/recommendations-table";
import type { Recommendation } from "@/types";

export const metadata = {
  title: "추천 | StockAnalysis AI",
};

export default async function RecommendPage() {
  const supabase = await createClient();

  const { data: recommendations } = await supabase
    .from("recommendations")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .returns<Recommendation[]>();

  const allRecs = recommendations ?? [];
  const activeCount = allRecs.length;
  const highConfidenceCount = allRecs.filter(
    (r) => r.confidence_score !== null && r.confidence_score >= 0.7,
  ).length;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">AI 추천</h1>
          <p className="text-muted-foreground text-sm">
            RSI, MACD, 볼린저밴드, PER 기반 AI 스크리닝 결과입니다.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 추천</CardTitle>
              <Sparkles className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}개</div>
              <p className="text-muted-foreground text-xs">현재 유효한 추천</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">고신뢰 추천</CardTitle>
              <TrendingUp className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{highConfidenceCount}개</div>
              <p className="text-muted-foreground text-xs">신뢰도 70% 이상</p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border">
          <RecommendationsTable recommendations={allRecs} />
        </div>

        <p className="text-muted-foreground mt-4 text-center text-xs">
          * AI 추천은 투자 참고용이며, 최종 투자 판단의 책임은 본인에게
          있습니다.
        </p>
      </main>
    </div>
  );
}
