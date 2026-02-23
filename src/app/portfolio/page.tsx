import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import {
  calculateHoldingStats,
  calculateUnrealizedPnL,
  getLatestBuyPrice,
} from "@/lib/portfolio/calculations";
import { PortfolioSummaryCards } from "@/components/portfolio/portfolio-summary-cards";
import {
  HoldingsTable,
  type HoldingRow,
} from "@/components/portfolio/holdings-table";
import { AddPortfolioDialog } from "@/components/portfolio/add-portfolio-dialog";
import type { MarketType, Portfolio, Transaction } from "@/types";

export const metadata = {
  title: "포트폴리오 | StockAnalysis AI",
};

export default async function PortfolioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 삭제되지 않은 포트폴리오 조회
  const { data: portfolios } = await supabase
    .from("portfolio")
    .select("*")
    .eq("user_id", user!.id)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
    .returns<Portfolio[]>();

  // 전체 거래 조회
  const { data: allTransactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user!.id)
    .order("trade_date", { ascending: true })
    .returns<Transaction[]>();

  // 포트폴리오별 거래 그룹핑
  const txByPortfolio = new Map<string, Transaction[]>();
  for (const tx of allTransactions ?? []) {
    const list = txByPortfolio.get(tx.portfolio_id) ?? [];
    list.push(tx);
    txByPortfolio.set(tx.portfolio_id, list);
  }

  // 보유 종목 데이터 계산
  const holdings: HoldingRow[] = (portfolios ?? [])
    .map((p) => {
      const transactions = txByPortfolio.get(p.id) ?? [];
      const stats = calculateHoldingStats(transactions);
      const currentPrice = getLatestBuyPrice(transactions);
      const pnl = calculateUnrealizedPnL(stats, currentPrice);

      return {
        id: p.id,
        ticker: p.ticker,
        companyName: p.company_name,
        market: p.market as MarketType,
        sector: p.sector,
        stats,
        pnl,
      };
    })
    .filter((h) => h.stats.quantity > 0 || txByPortfolio.has(h.id) === false);

  // 요약 데이터 집계
  const totalInvested = holdings.reduce(
    (sum, h) => sum + h.stats.totalInvested,
    0,
  );
  const totalMarketValue = holdings.reduce(
    (sum, h) => sum + h.pnl.marketValue,
    0,
  );
  const totalUnrealizedPnL = totalMarketValue - totalInvested;
  const totalUnrealizedPnLPercent =
    totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0;
  const holdingCount = holdings.filter((h) => h.stats.quantity > 0).length;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">포트폴리오</h1>
            <p className="text-muted-foreground text-sm">
              보유 종목과 투자 현황을 확인하세요.
            </p>
          </div>
          <AddPortfolioDialog />
        </div>

        <div className="mb-8">
          <PortfolioSummaryCards
            totalInvested={totalInvested}
            totalMarketValue={totalMarketValue}
            totalUnrealizedPnL={totalUnrealizedPnL}
            totalUnrealizedPnLPercent={totalUnrealizedPnLPercent}
            holdingCount={holdingCount}
          />
        </div>

        <div className="rounded-lg border">
          <HoldingsTable holdings={holdings} />
        </div>

        <p className="text-muted-foreground mt-4 text-center text-xs">
          * 현재가는 최근 매수 가격을 기준으로 표시됩니다. 투자 판단의 참고
          자료로만 활용해주세요.
        </p>
      </main>
    </div>
  );
}
