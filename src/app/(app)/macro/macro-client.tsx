"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Badge } from "@/components/ui/badge";
import { SentimentTable } from "@/components/macro/sentiment-table";
import { apiFetch } from "@/lib/api/client";
import {
  getSentimentResults,
  getCategorySummary,
} from "@/lib/api/macro";
import type { SentimentResult, NewsCategorySummary } from "@/types";

interface MacroSnapshot {
  snapshot_data: {
    indices?: Record<string, number | null>;
    exchange_rates?: Record<string, number | null>;
    commodities?: Record<string, number | null>;
    rates_and_fear?: Record<string, number | null>;
  };
  collected_at: string;
}

interface IndicatorItem {
  label: string;
  value: number | null;
  unit?: string;
}

interface Category {
  title: string;
  items: IndicatorItem[];
}

const categoryLabels: Record<string, string> = {
  MACRO_FINANCE: "거시경제 & 금융",
  GEOPOLITICS: "지정학 & 국제정세",
  TECH_INDUSTRY: "기술 & 산업",
  ENERGY: "전력/에너지",
  DOMESTIC_POLITICS: "국내 정치",
  INTL_POLITICS: "국제 정치 & 외교",
  BREAKING_DISASTER: "속보 & 재난",
  ECONOMIC_POLICY: "경제 정책 & 규제",
  LIFESTYLE_ASSET: "생활 & 자산",
};

function ScoreBar({ score }: { score: number }) {
  // score: -1.0 ~ 1.0 → percentage: 0% ~ 100%
  const pct = ((score + 1) / 2) * 100;
  const color =
    score > 0.2
      ? "bg-green-500"
      : score < -0.2
        ? "bg-red-500"
        : "bg-yellow-500";

  return (
    <div className="bg-muted h-2 w-full rounded-full">
      <div
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${Math.max(pct, 5)}%` }}
      />
    </div>
  );
}

export function MacroContent() {
  const [data, setData] = useState<MacroSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [summaries, setSummaries] = useState<NewsCategorySummary[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sentiments, setSentiments] = useState<SentimentResult[]>([]);
  const [sentimentLoading, setSentimentLoading] = useState(false);

  // 거시 데이터 로드
  useEffect(() => {
    apiFetch<MacroSnapshot>("/macro/latest")
      .then(setData)
      .catch(() => {
        setData(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [retryKey]);

  // 카테고리 요약 로드
  useEffect(() => {
    getCategorySummary()
      .then((res) => setSummaries(res.summaries))
      .catch(() => setSummaries([]))
      .finally(() => setSummaryLoading(false));
  }, []);

  // 카테고리 선택 핸들러
  const handleCategorySelect = (catKey: string) => {
    if (selectedCategory === catKey) {
      setSelectedCategory(null);
      setSentiments([]);
      setSentimentLoading(false);
    } else {
      setSelectedCategory(catKey);
      setSentiments([]);
      setSentimentLoading(true);
    }
  };

  // 카테고리 선택 시 해당 뉴스 로드
  useEffect(() => {
    if (selectedCategory === null) return;

    let cancelled = false;
    const fetchSentiments = async () => {
      try {
        const res = await getSentimentResults({
          limit: 30,
          news_category: selectedCategory,
        });
        if (!cancelled) setSentiments(res.results);
      } catch {
        if (!cancelled) setSentiments([]);
      } finally {
        if (!cancelled) setSentimentLoading(false);
      }
    };
    fetchSentiments();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="거시경제 데이터를 불러올 수 없습니다."
        onRetry={() => {
          setError(false);
          setLoading(true);
          setRetryKey((k) => k + 1);
        }}
      />
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground text-sm">
            거시경제 데이터가 아직 수집되지 않았습니다. 스케줄러가 매일 07:00 KST에 수집합니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sd = data.snapshot_data;

  const categories: Category[] = [
    {
      title: "주요 지수",
      items: [
        { label: "S&P 500", value: sd.indices?.sp500 ?? null },
        { label: "나스닥", value: sd.indices?.nasdaq ?? null },
        { label: "코스피", value: sd.indices?.kospi ?? null },
        { label: "닛케이 225", value: sd.indices?.nikkei ?? null },
        { label: "상하이 종합", value: sd.indices?.shanghai ?? null },
      ],
    },
    {
      title: "환율",
      items: [
        { label: "원/달러", value: sd.exchange_rates?.usd_krw ?? null, unit: "원" },
        { label: "엔/달러", value: sd.exchange_rates?.usd_jpy ?? null, unit: "엔" },
        { label: "유로/달러", value: sd.exchange_rates?.eur_usd ?? null },
        { label: "위안/원", value: sd.exchange_rates?.cny_krw ?? null, unit: "원" },
      ],
    },
    {
      title: "원자재",
      items: [
        { label: "WTI 원유", value: sd.commodities?.wti ?? null, unit: "$" },
        { label: "금", value: sd.commodities?.gold ?? null, unit: "$" },
        { label: "구리", value: sd.commodities?.copper ?? null, unit: "$" },
        { label: "천연가스", value: sd.commodities?.natural_gas ?? null, unit: "$" },
      ],
    },
    {
      title: "금리 & 지표",
      items: [
        { label: "미 10년 국채", value: sd.rates_and_fear?.us_10y_yield ?? null, unit: "%" },
        { label: "VIX", value: sd.rates_and_fear?.vix ?? null },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-xs">
        최종 수집: {new Date(data.collected_at).toLocaleString("ko-KR")}
      </p>

      {/* 거시경제 지표 */}
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((cat) => (
          <Card key={cat.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{cat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cat.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">
                      {item.value != null
                        ? `${item.unit === "$" ? "$" : ""}${item.value.toLocaleString()}${item.unit && item.unit !== "$" ? item.unit : ""}`
                        : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 9개 카테고리 뉴스 분석 요약 */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">뉴스 카테고리별 감성 분석</h2>
        {summaryLoading ? (
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : summaries.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground text-sm">
                아직 분석된 뉴스가 없습니다. 관리자가 감성 분석을 실행하면 카테고리별 요약이 표시됩니다.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {summaries.map((s) => {
              const isSelected = selectedCategory === s.category_key;
              return (
                <Card
                  key={s.category_key}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => handleCategorySelect(s.category_key)}
                >
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {categoryLabels[s.category_key] ?? s.display_name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {s.total}건
                      </Badge>
                    </div>
                    <ScoreBar score={s.avg_score} />
                    <div className="mt-2 flex gap-2 text-xs">
                      <span className="text-green-600">
                        긍정 {s.bullish}
                      </span>
                      <span className="text-muted-foreground">
                        중립 {s.neutral}
                      </span>
                      <span className="text-red-600">
                        부정 {s.bearish}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 선택된 카테고리의 상세 뉴스 목록 */}
      {selectedCategory && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">
            {categoryLabels[selectedCategory] ?? selectedCategory} 뉴스
          </h2>
          {sentimentLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <SentimentTable sentiments={sentiments} />
          )}
        </div>
      )}
    </div>
  );
}
