import type { Metadata } from "next";

import { TickerGuideContent } from "./ticker-guide-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>;
}): Promise<Metadata> {
  const { ticker } = await params;
  return {
    title: `${ticker} 투자 가이드`,
    description: `${ticker} 거시경제+지정학 기반 투자 가이드`,
  };
}

export default async function TickerGuidePage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;

  return <TickerGuideContent ticker={ticker} />;
}
