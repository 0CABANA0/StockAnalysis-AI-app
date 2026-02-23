"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchIndicators, type TechnicalIndicators } from "@/lib/api/stock";

interface IndicatorCardsProps {
  ticker: string;
}

function signalColor(signal: string): "default" | "destructive" | "secondary" {
  if (
    signal.includes("매수") ||
    signal.includes("상승") ||
    signal.includes("정배열")
  )
    return "default";
  if (
    signal.includes("매도") ||
    signal.includes("하락") ||
    signal.includes("역배열")
  )
    return "destructive";
  return "secondary";
}

export function IndicatorCards({ ticker }: IndicatorCardsProps) {
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await fetchIndicators(ticker);
        if (!cancelled) setIndicators(res.indicators);
      } catch {
        // 로딩 실패 시 빈 상태 유지
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  if (loading) {
    return (
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex h-[120px] items-center justify-center">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!indicators) {
    return (
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "RSI (14)", description: "과매수/과매도 지표" },
          { label: "MACD", description: "추세 전환 시그널" },
          { label: "볼린저밴드", description: "변동성 상/하한선" },
          { label: "이동평균", description: "20일 / 60일 / 120일" },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-2xl font-bold">-</div>
              <p className="text-muted-foreground text-xs">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { rsi, macd, bollinger_bands, sma } = indicators;

  const cards = [
    {
      label: "RSI (14)",
      value: rsi.value !== null ? rsi.value.toFixed(1) : "-",
      signal: rsi.signal,
      description: "과매수/과매도 지표",
    },
    {
      label: "MACD",
      value: macd.histogram !== null ? macd.histogram.toFixed(4) : "-",
      signal: macd.signal,
      description: `Line ${macd.macd_line?.toFixed(2) ?? "-"} / Signal ${macd.signal_line?.toFixed(2) ?? "-"}`,
    },
    {
      label: "볼린저밴드",
      value:
        bollinger_bands.middle !== null
          ? bollinger_bands.middle.toFixed(0)
          : "-",
      signal: bollinger_bands.signal,
      description: `${bollinger_bands.lower?.toFixed(0) ?? "-"} ~ ${bollinger_bands.upper?.toFixed(0) ?? "-"}`,
    },
    {
      label: "이동평균",
      value: sma.sma_20 !== null ? sma.sma_20.toFixed(0) : "-",
      signal: sma.signal,
      description: `20: ${sma.sma_20?.toFixed(0) ?? "-"} / 60: ${sma.sma_60?.toFixed(0) ?? "-"} / 120: ${sma.sma_120?.toFixed(0) ?? "-"}`,
    },
  ];

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <Badge variant={signalColor(card.signal)} className="mt-1 text-xs">
              {card.signal}
            </Badge>
            <p className="text-muted-foreground mt-2 text-xs">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
