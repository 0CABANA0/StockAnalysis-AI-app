"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type LineData,
  type Time,
} from "lightweight-charts";

export interface OhlcData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  data: OhlcData[];
  height?: number;
  showVolume?: boolean;
  showSma?: boolean;
  smaPeriods?: number[];
}

const SMA_COLORS = ["#f59e0b", "#8b5cf6", "#06b6d4"];

function calculateSma(
  data: OhlcData[],
  period: number,
): LineData<Time>[] {
  const result: LineData<Time>[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j].close;
    }
    result.push({
      time: data[i].date as Time,
      value: sum / period,
    });
  }
  return result;
}

export function CandlestickChart({
  data,
  height = 400,
  showVolume = true,
  showSma = true,
  smaPeriods = [20, 60],
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const isDark = resolvedTheme === "dark";

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { color: isDark ? "#09090b" : "#ffffff" },
        textColor: isDark ? "#a1a1aa" : "#333333",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: isDark ? "#27272a" : "#f0f0f0" },
        horzLines: { color: isDark ? "#27272a" : "#f0f0f0" },
      },
      rightPriceScale: {
        borderColor: isDark ? "#3f3f46" : "#e5e5e5",
      },
      timeScale: {
        borderColor: isDark ? "#3f3f46" : "#e5e5e5",
        timeVisible: false,
      },
      crosshair: {
        mode: 0,
      },
    });
    chartRef.current = chart;

    // 캔들스틱 시리즈
    const candleSeries: ISeriesApi<"Candlestick"> = chart.addSeries(
      CandlestickSeries,
      {
        upColor: "#16a34a",
        downColor: "#dc2626",
        borderVisible: false,
        wickUpColor: "#16a34a",
        wickDownColor: "#dc2626",
      },
    );

    candleSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.05,
        bottom: showVolume ? 0.25 : 0.05,
      },
    });

    const candleData: CandlestickData<Time>[] = data.map((d) => ({
      time: d.date as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));
    candleSeries.setData(candleData);

    // 거래량 히스토그램
    if (showVolume) {
      const volumeSeries: ISeriesApi<"Histogram"> = chart.addSeries(
        HistogramSeries,
        {
          priceFormat: { type: "volume" },
          priceScaleId: "",
        },
      );

      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });

      const volumeData: HistogramData<Time>[] = data.map((d) => ({
        time: d.date as Time,
        value: d.volume,
        color: d.close >= d.open ? "#16a34a40" : "#dc262640",
      }));
      volumeSeries.setData(volumeData);
    }

    // SMA 오버레이
    if (showSma) {
      smaPeriods.forEach((period, idx) => {
        if (data.length < period) return;

        const smaLine: ISeriesApi<"Line"> = chart.addSeries(LineSeries, {
          color: SMA_COLORS[idx % SMA_COLORS.length],
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });

        smaLine.setData(calculateSma(data, period));
      });
    }

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [data, height, showVolume, showSma, smaPeriods, resolvedTheme]);

  if (data.length === 0) {
    return (
      <div
        className="text-muted-foreground flex items-center justify-center text-sm"
        style={{ height }}
      >
        캔들 데이터를 가져올 수 없습니다.
      </div>
    );
  }

  return <div ref={containerRef} style={{ height }} />;
}
