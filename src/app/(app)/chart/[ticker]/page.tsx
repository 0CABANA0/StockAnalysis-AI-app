import type { Metadata } from "next";

import { CandlestickChart } from "lucide-react";
import { ChartContent } from "./chart-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>;
}): Promise<Metadata> {
  const { ticker } = await params;
  return {
    title: `${ticker} 차트`,
    description: `${ticker} 캔들스틱 차트 및 기술적 지표 (RSI/MACD/BB/SMA)`,
  };
}

export default async function ChartPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <CandlestickChart className="size-6" />
          {ticker} 차트
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          가격 데이터 및 기술적 지표 (RSI / MACD / BB / SMA)
        </p>
      </div>
      <ChartContent ticker={ticker} />
    </div>
  );
}
