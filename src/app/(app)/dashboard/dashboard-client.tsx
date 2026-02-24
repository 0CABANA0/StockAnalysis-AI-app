"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { apiFetch } from "@/lib/api/client";
import type { TodayGuideResponse } from "@/lib/api/guide";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Globe,
  BarChart3,
  AlertTriangle,
  Calendar,
  ArrowRight,
} from "lucide-react";

// ─── 시장 현황 ───

interface MacroData {
  sp500: number | null;
  nasdaq: number | null;
  kospi: number | null;
  usd_krw: number | null;
  vix: number | null;
}

export function MarketOverview() {
  const [data, setData] = useState<MacroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError(false);
    apiFetch<{
      id: string;
      snapshot_data: {
        indices?: { sp500?: number; nasdaq?: number; kospi?: number };
        exchange_rates?: { usd_krw?: number };
        rates_and_fear?: { vix?: number };
      };
    }>("/macro/latest")
      .then((res) => {
        const sd = res.snapshot_data;
        setData({
          sp500: sd?.indices?.sp500 ?? null,
          nasdaq: sd?.indices?.nasdaq ?? null,
          kospi: sd?.indices?.kospi ?? null,
          usd_krw: sd?.exchange_rates?.usd_krw ?? null,
          vix: sd?.rates_and_fear?.vix ?? null,
        });
      })
      .catch(() => {
        setData(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch, loadData reused by onRetry
    loadData();
  }, []);

  const items = [
    { name: "S&P 500", value: data?.sp500 },
    { name: "나스닥", value: data?.nasdaq },
    { name: "코스피", value: data?.kospi },
    { name: "원/달러", value: data?.usd_krw },
  ];

  if (error && !data) {
    return (
      <ErrorState
        message="시장 데이터를 불러올 수 없습니다. 백엔드 연결을 확인해 주세요."
        onRetry={loadData}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.name}>
          <CardContent className="p-3">
            <p className="text-muted-foreground text-xs">{item.name}</p>
            {loading ? (
              <Skeleton className="my-1 h-6 w-20" />
            ) : (
              <p className="text-lg font-bold">
                {item.value != null ? item.value.toLocaleString() : "—"}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── 신호등 시스템 ───

export function SignalSystem() {
  const [vix, setVix] = useState<number | null>(null);
  const [maxGeoLevel, setMaxGeoLevel] = useState<string>("—");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const [macroRes, geoRes] = await Promise.allSettled([
          apiFetch<{ vix: number | null }>("/macro/latest"),
          apiFetch<{ risks: { risk_level: string }[] }>("/geo/current"),
        ]);

        if (macroRes.status === "fulfilled") {
          setVix(macroRes.value.vix);
        }

        if (geoRes.status === "fulfilled") {
          const levels = geoRes.value.risks.map((r) => r.risk_level);
          const order = ["CRITICAL", "HIGH", "MODERATE", "LOW"];
          for (const lvl of order) {
            if (levels.includes(lvl)) {
              setMaxGeoLevel(lvl);
              break;
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSignals();
  }, []);

  const vixColor =
    vix == null
      ? "bg-gray-400"
      : vix < 20
        ? "bg-green-500"
        : vix < 30
          ? "bg-yellow-400"
          : "bg-red-500";

  const vixLabel =
    vix == null
      ? "데이터 없음"
      : vix < 20
        ? `안정 (VIX ${vix.toFixed(1)})`
        : vix < 30
          ? `주의 (VIX ${vix.toFixed(1)})`
          : `위험 (VIX ${vix.toFixed(1)})`;

  const geoColorMap: Record<string, string> = {
    CRITICAL: "bg-red-600",
    HIGH: "bg-red-500",
    MODERATE: "bg-yellow-400",
    LOW: "bg-green-500",
  };
  const geoColor = geoColorMap[maxGeoLevel] ?? "bg-gray-400";
  const geoLabelMap: Record<string, string> = {
    CRITICAL: "위험",
    HIGH: "경계",
    MODERATE: "주의",
    LOW: "안정",
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4" />
            거시경제 신호
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-5 w-40" />
          ) : (
            <div className="flex items-center gap-3">
              <span className={`inline-block size-4 rounded-full ${vixColor}`} />
              <span className="text-sm">{vixLabel}</span>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="size-4" />
            지정학 리스크
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-5 w-40" />
          ) : (
            <div className="flex items-center gap-3">
              <span className={`inline-block size-4 rounded-full ${geoColor}`} />
              <span className="text-sm">
                {geoLabelMap[maxGeoLevel] ?? "데이터 없음"} ({maxGeoLevel})
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── 오늘의 가이드 ───

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

export function TodayGuideSection() {
  const [guide, setGuide] = useState<TodayGuideResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<TodayGuideResponse>("/guide/today")
      .then(setGuide)
      .catch(() => setGuide(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!guide || (!guide.market_summary && guide.action_cards.length === 0)) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="text-muted-foreground mb-2 size-8" />
          <p className="text-muted-foreground text-sm">
            아직 생성된 가이드가 없습니다. 데이터 수집 후 자동 생성됩니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {guide.market_summary && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed">{guide.market_summary}</p>
            {guide.geo_summary && (
              <p className="text-muted-foreground mt-2 text-xs">
                {guide.geo_summary}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {guide.action_cards.length > 0 && (
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {guide.action_cards.map((card) => (
            <Link key={card.ticker} href={`/guide/${card.ticker}`}>
              <Card className="transition-colors hover:bg-accent/50">
                <CardContent className="p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium">{card.company_name}</span>
                    <Badge
                      className={
                        actionColorMap[card.action] ?? "bg-gray-100 text-gray-800"
                      }
                    >
                      {actionLabelMap[card.action] ?? card.action}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">{card.ticker}</p>
                  <p className="mt-1 text-xs leading-relaxed">{card.reason}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="text-right">
        <Link
          href="/guide"
          className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
        >
          전체 가이드 보기 <ArrowRight className="size-3" />
        </Link>
      </div>
    </div>
  );
}

// ─── 주요 이벤트 ───

export function KeyEventsSection() {
  const [events, setEvents] = useState<
    { time: string; title: string; importance: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    apiFetch<{ events: { event_date: string; event_title: string; importance: string }[] }>(
      `/calendar/?start_date=${today}&end_date=${today}`,
    )
      .then((res) => {
        setEvents(
          (res.events || []).map((e) => ({
            time: "종일",
            title: e.event_title,
            importance: e.importance,
          })),
        );
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-16 w-full" />;

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-muted-foreground text-sm">
            오늘 등록된 이벤트가 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const importanceBadge: Record<string, string> = {
    HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    LOW: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <Card>
      <CardContent className="divide-y p-0">
        {events.map((ev, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Calendar className="text-muted-foreground size-4 shrink-0" />
            <span className="flex-1 text-sm">{ev.title}</span>
            <Badge className={importanceBadge[ev.importance] ?? importanceBadge.LOW}>
              {ev.importance}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
