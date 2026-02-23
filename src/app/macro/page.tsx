import {
  DollarSign,
  Flame,
  TrendingDown,
  Activity,
  Newspaper,
} from "lucide-react";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { SentimentTable } from "@/components/macro/sentiment-table";
import type { MacroSnapshot, SentimentResult } from "@/types";

export const metadata = {
  title: "거시경제 | StockAnalysis AI",
};

function formatValue(value: number | null, suffix = ""): string {
  if (value === null) return "-";
  return `${value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}${suffix}`;
}

export default async function MacroPage() {
  const supabase = await createClient();

  const [macroResult, sentimentResult] = await Promise.all([
    supabase
      .from("macro_snapshots")
      .select("*")
      .order("collected_at", { ascending: false })
      .limit(1)
      .returns<MacroSnapshot[]>(),
    supabase
      .from("sentiment_results")
      .select("*")
      .order("analyzed_at", { ascending: false })
      .limit(20)
      .returns<SentimentResult[]>(),
  ]);

  const macro = macroResult.data?.[0] ?? null;
  const sentiments = sentimentResult.data ?? [];

  const macroIndicators = [
    {
      label: "USD/KRW",
      value: formatValue(macro?.usd_krw ?? null, "원"),
      icon: DollarSign,
    },
    { label: "VIX", value: formatValue(macro?.vix ?? null), icon: Activity },
    {
      label: "미국 10년물 금리",
      value: formatValue(macro?.us_10y_yield ?? null, "%"),
      icon: TrendingDown,
    },
    {
      label: "WTI 유가",
      value: formatValue(macro?.wti ?? null, "$"),
      icon: Flame,
    },
    {
      label: "금",
      value: formatValue(macro?.gold ?? null, "$"),
      icon: DollarSign,
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">거시경제 분석</h1>
          <p className="text-muted-foreground text-sm">
            글로벌 거시 지표와 뉴스 감성 분석 결과를 확인하세요.
          </p>
          {macro && (
            <p className="text-muted-foreground mt-1 text-xs">
              마지막 수집:{" "}
              {new Date(macro.collected_at).toLocaleString("ko-KR")}
            </p>
          )}
        </div>

        {/* 거시 지표 카드 */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {macroIndicators.map((ind) => (
            <Card key={ind.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {ind.label}
                </CardTitle>
                <ind.icon className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{ind.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 뉴스 감성 분석 */}
        <div className="mb-4 flex items-center gap-2">
          <Newspaper className="size-5" />
          <h2 className="text-lg font-semibold">뉴스 감성 분석</h2>
        </div>
        <div className="rounded-lg border">
          <SentimentTable sentiments={sentiments} />
        </div>

        <p className="text-muted-foreground mt-4 text-center text-xs">
          * 거시경제 데이터와 감성 분석은 투자 참고용이며, 최종 투자 판단의
          책임은 본인에게 있습니다.
        </p>
      </main>
    </div>
  );
}
