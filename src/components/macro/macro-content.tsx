"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  Flame,
  TrendingDown,
  Activity,
  Newspaper,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SentimentTable } from "@/components/macro/sentiment-table";
import { collectMacroData, collectSentiment } from "@/lib/api/macro";
import type { MacroSnapshot, SentimentResult } from "@/types";

function formatValue(value: number | null, suffix = ""): string {
  if (value === null) return "-";
  return `${value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}${suffix}`;
}

interface MacroContentProps {
  macro: MacroSnapshot | null;
  sentiments: SentimentResult[];
  isAdmin: boolean;
}

export function MacroContent({
  macro,
  sentiments,
  isAdmin,
}: MacroContentProps) {
  const router = useRouter();
  const [collectingMacro, setCollectingMacro] = useState(false);
  const [collectingSentiment, setCollectingSentiment] = useState(false);

  async function handleCollectMacro() {
    setCollectingMacro(true);
    try {
      const result = await collectMacroData();
      if (result.success) {
        toast.success("거시 데이터가 수집되었습니다.");
        if (result.failed_tickers.length > 0) {
          toast.warning(
            `일부 실패: ${result.failed_tickers.join(", ")}`,
          );
        }
        router.refresh();
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "거시 데이터 수집에 실패했습니다.",
      );
    } finally {
      setCollectingMacro(false);
    }
  }

  async function handleCollectSentiment() {
    setCollectingSentiment(true);
    try {
      const result = await collectSentiment();
      if (result.success) {
        toast.success(
          `뉴스 ${result.articles_collected}건 수집, ${result.articles_analyzed}건 분석 완료`,
        );
        router.refresh();
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "감성 분석 실행에 실패했습니다.",
      );
    } finally {
      setCollectingSentiment(false);
    }
  }

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
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
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

        {/* 관리자 전용 수동 수집 버튼 */}
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCollectMacro}
              disabled={collectingMacro}
            >
              {collectingMacro ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="mr-1.5 size-3.5" />
              )}
              거시 수집
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCollectSentiment}
              disabled={collectingSentiment}
            >
              {collectingSentiment ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Newspaper className="mr-1.5 size-3.5" />
              )}
              감성 분석
            </Button>
          </div>
        )}
      </div>

      {/* 거시 지표 카드 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {macroIndicators.map((ind) => (
          <Card key={ind.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{ind.label}</CardTitle>
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
        * 거시경제 데이터와 감성 분석은 투자 참고용이며, 최종 투자 판단의 책임은
        본인에게 있습니다.
      </p>
    </main>
  );
}
