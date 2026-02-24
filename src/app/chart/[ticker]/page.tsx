import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { StockChart } from "@/components/charts/stock-chart";
import { IndicatorCards } from "@/components/charts/indicator-cards";
import { QuoteCard } from "@/components/charts/quote-card";
import { serverApiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/server";
import type { Portfolio } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  return { title: `${decodeURIComponent(ticker).toUpperCase()} 차트 | StockAnalysis AI` };
}

export default async function ChartPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const decodedTicker = decodeURIComponent(ticker).toUpperCase();

  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let portfolio: Portfolio | null = null;

  if (session?.access_token) {
    try {
      portfolio = await serverApiFetch<Portfolio | null>(
        `/portfolio/my/by-ticker/${encodeURIComponent(decodedTicker)}`,
        session.access_token,
      );
    } catch {
      // 포트폴리오 미등록 종목 — null 유지
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{decodedTicker}</h1>
            {portfolio && <Badge variant="secondary">{portfolio.market}</Badge>}
          </div>
          <p className="text-muted-foreground text-sm">
            {portfolio?.company_name ?? decodedTicker} — 기술적 분석 차트
          </p>
        </div>

        {/* 현재가 카드 */}
        <QuoteCard
          ticker={decodedTicker}
          companyName={portfolio?.company_name}
        />

        {/* TradingView 캔들스틱 차트 */}
        <StockChart ticker={decodedTicker} />

        {/* 기술적 지표 카드 */}
        <IndicatorCards ticker={decodedTicker} />

        <p className="text-muted-foreground text-center text-xs">
          * 기술적 지표는 투자 참고용이며, 최종 투자 판단의 책임은 본인에게
          있습니다.
        </p>
      </main>
    </div>
  );
}
