"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { OhlcData } from "@/components/chart/candlestick-chart";
import { fetchCandles, fetchIndicators, fetchQuote } from "@/lib/api/stock";

const CandlestickChart = dynamic(
  () =>
    import("@/components/chart/candlestick-chart").then((mod) => mod.CandlestickChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[400px] w-full" />,
  },
);

interface Indicators {
  rsi: { value: number | null; signal: string };
  macd: {
    macd_line: number | null;
    signal_line: number | null;
    histogram: number | null;
    signal: string;
  };
  bollinger_bands: {
    upper: number | null;
    middle: number | null;
    lower: number | null;
    signal: string;
  };
  sma: {
    sma_20: number | null;
    sma_60: number | null;
    sma_120: number | null;
    signal: string;
  };
}

interface Quote {
  ticker: string;
  price: number | null;
  change: number | null;
  change_percent: number | null;
  volume: number | null;
  name: string;
}

const periods = ["1mo", "3mo", "6mo", "1y", "2y"] as const;

const signalColor: Record<string, string> = {
  매수: "text-green-600",
  과매도: "text-green-600",
  하단접근: "text-green-600",
  매도: "text-red-600",
  과매수: "text-red-600",
  상단접근: "text-red-600",
  중립: "text-yellow-600",
  골든크로스: "text-green-600",
  데드크로스: "text-red-600",
  상승: "text-green-600",
  하락: "text-red-600",
};

export function ChartContent({ ticker }: { ticker: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [candles, setCandles] = useState<OhlcData[]>([]);
  const [indicators, setIndicators] = useState<Indicators | null>(null);
  const [period, setPeriod] = useState<string>("6mo");
  const [loading, setLoading] = useState(true);

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    setLoading(true);
  };

  // 현재가 + 기술적 지표 로드
  useEffect(() => {
    Promise.all([
      fetchQuote(ticker).catch(() => null),
      fetchIndicators(ticker).catch(() => null),
    ]).then(([q, ind]) => {
      setQuote(q as Quote | null);
      setIndicators((ind as { indicators: Indicators } | null)?.indicators ?? null);
    });
  }, [ticker]);

  // 캔들 데이터 로드
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchCandles(ticker, period);
        if (!cancelled) setCandles((res as { candles: OhlcData[] }).candles);
      } catch {
        if (!cancelled) setCandles([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [ticker, period]);

  return (
    <div className="space-y-4">
      {/* 현재가 */}
      {quote && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-baseline gap-3">
              <span className="text-sm font-medium">{quote.name || ticker}</span>
              <span className="text-2xl font-bold">
                {quote.price != null ? quote.price.toLocaleString() : "—"}
              </span>
              {quote.change_percent != null && (
                <span
                  className={`text-sm font-medium ${
                    quote.change_percent >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {quote.change_percent > 0 ? "+" : ""}
                  {quote.change_percent.toFixed(2)}%
                </span>
              )}
              {quote.volume != null && (
                <span className="text-muted-foreground text-xs">
                  거래량 {quote.volume.toLocaleString()}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 기간 선택 */}
      <div className="flex gap-2">
        {periods.map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            onClick={() => handlePeriodChange(p)}
          >
            {p}
          </Button>
        ))}
      </div>

      {/* 캔들스틱 차트 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {ticker} 차트 ({candles.length}일)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <CandlestickChart
              data={candles}
              height={400}
              showVolume
              showSma
              smaPeriods={[20, 60]}
            />
          )}
        </CardContent>
      </Card>

      {/* SMA 범례 */}
      {!loading && candles.length > 0 && (
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-[#f59e0b]" />
            SMA 20
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-[#8b5cf6]" />
            SMA 60
          </span>
        </div>
      )}

      {/* 기술적 지표 */}
      {indicators && (
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">RSI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {indicators.rsi.value?.toFixed(1) ?? "—"}
                </span>
                <Badge
                  className={
                    signalColor[indicators.rsi.signal] ??
                    "text-muted-foreground"
                  }
                  variant="outline"
                >
                  {indicators.rsi.signal || "—"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">MACD</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  MACD: {indicators.macd.macd_line?.toFixed(2) ?? "—"} / 신호:{" "}
                  {indicators.macd.signal_line?.toFixed(2) ?? "—"}
                </span>
                <Badge
                  className={
                    signalColor[indicators.macd.signal] ??
                    "text-muted-foreground"
                  }
                  variant="outline"
                >
                  {indicators.macd.signal || "—"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">볼린저 밴드</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">상단</span>
                  <span>
                    {indicators.bollinger_bands.upper?.toLocaleString() ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">중간</span>
                  <span>
                    {indicators.bollinger_bands.middle?.toLocaleString() ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">하단</span>
                  <span>
                    {indicators.bollinger_bands.lower?.toLocaleString() ?? "—"}
                  </span>
                </div>
              </div>
              <Badge
                className={`mt-2 ${signalColor[indicators.bollinger_bands.signal] ?? ""}`}
                variant="outline"
              >
                {indicators.bollinger_bands.signal || "—"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">이동평균</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SMA 20</span>
                  <span>
                    {indicators.sma.sma_20?.toLocaleString() ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SMA 60</span>
                  <span>
                    {indicators.sma.sma_60?.toLocaleString() ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SMA 120</span>
                  <span>
                    {indicators.sma.sma_120?.toLocaleString() ?? "—"}
                  </span>
                </div>
              </div>
              <Badge
                className={`mt-2 ${signalColor[indicators.sma.signal] ?? ""}`}
                variant="outline"
              >
                {indicators.sma.signal || "—"}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
