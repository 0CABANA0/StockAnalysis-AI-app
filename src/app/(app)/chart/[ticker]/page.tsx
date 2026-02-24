import type { Metadata } from "next";

import { LineChart } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
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
      <PageHeader
        icon={<LineChart className="size-5" />}
        title={`${ticker} 차트`}
        description="실시간 캔들스틱 차트"
      />
      <ChartContent ticker={ticker} />
    </div>
  );
}
