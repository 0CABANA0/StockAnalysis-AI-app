"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  ColorType,
  type CandlestickData,
  type Time,
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchCandles, type CandleData } from "@/lib/api/stock";

const PERIOD_OPTIONS = [
  { value: "1mo", label: "1개월" },
  { value: "3mo", label: "3개월" },
  { value: "6mo", label: "6개월" },
  { value: "1y", label: "1년" },
  { value: "2y", label: "2년" },
];

function toCandlestickData(candles: CandleData[]): CandlestickData<Time>[] {
  return candles.map((c) => ({
    time: c.date as Time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));
}

interface StockChartProps {
  ticker: string;
}

export function StockChart({ ticker }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const [period, setPeriod] = useState("6mo");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(
    async (selectedPeriod: string) => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchCandles(ticker, selectedPeriod, "1d");

        if (seriesRef.current) {
          seriesRef.current.setData(toCandlestickData(data.candles));
        }
        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(
            data.candles.map((c) => ({
              time: c.date as Time,
              value: c.volume,
              color: c.close >= c.open ? "#26a69a80" : "#ef535080",
            })),
          );
        }
        chartRef.current?.timeScale().fitContent();
      } catch (e) {
        setError(e instanceof Error ? e.message : "데이터 로딩 실패");
      } finally {
        setLoading(false);
      }
    },
    [ticker],
  );

  // 차트 초기화
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#e5e7eb20" },
        horzLines: { color: "#e5e7eb20" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      crosshair: {
        mode: 0,
      },
      timeScale: {
        borderColor: "#e5e7eb40",
        timeVisible: false,
      },
      rightPriceScale: {
        borderColor: "#e5e7eb40",
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderDownColor: "#ef5350",
      borderUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      wickUpColor: "#26a69a",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // 반응형 리사이즈
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    loadData(period);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    loadData(value);
  };

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">캔들스틱 차트</CardTitle>
        <Select value={period} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div ref={chartContainerRef} className="h-[400px] w-full" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Loader2 className="text-muted-foreground size-8 animate-spin" />
            </div>
          )}
          {error && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80">
              <BarChart3 className="text-muted-foreground mb-4 size-12" />
              <p className="text-muted-foreground text-sm font-medium">
                {error}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                백엔드 서버 연결을 확인하세요.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
