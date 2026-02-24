import type { Metadata } from "next";

import { LineChart } from "lucide-react";
import { EtfDetailContent } from "./etf-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>;
}): Promise<Metadata> {
  const { ticker } = await params;
  return {
    title: `${ticker} ETF 상세`,
    description: `${ticker} ETF 상세 정보 및 비교 분석`,
  };
}

export default async function EtfDetailPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <LineChart className="size-6" />
          {ticker} ETF 상세
        </h1>
      </div>
      <EtfDetailContent ticker={ticker} />
    </div>
  );
}
