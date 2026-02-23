"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioSummaryCards } from "@/components/portfolio/portfolio-summary-cards";
import {
  HoldingsTable,
  type HoldingRow,
} from "@/components/portfolio/holdings-table";
import { AddPortfolioDialog } from "@/components/portfolio/add-portfolio-dialog";
import { InvestmentComparisonChart } from "@/components/charts/portfolio-charts";
import { useStockQuotes } from "@/hooks/use-stock-quotes";
import {
  calculateHoldingStats,
  calculateUnrealizedPnL,
  getLatestBuyPrice,
} from "@/lib/portfolio/calculations";
import type { MarketType, Portfolio, Transaction } from "@/types";

interface PortfolioContentProps {
  portfolios: Portfolio[];
  transactions: Transaction[];
}

export function PortfolioContent({
  portfolios,
  transactions,
}: PortfolioContentProps) {
  // 포트폴리오별 거래 그룹핑
  const txByPortfolio = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const list = map.get(tx.portfolio_id) ?? [];
      list.push(tx);
      map.set(tx.portfolio_id, list);
    }
    return map;
  }, [transactions]);

  // 고유 티커 목록 추출
  const tickers = useMemo(
    () => portfolios.map((p) => p.ticker),
    [portfolios],
  );

  // 실시간 시세 조회
  const { quotes, loading: quotesLoading } = useStockQuotes(tickers);

  // 보유 종목 데이터 계산 (시세 도착 시 자동 갱신)
  const holdings: HoldingRow[] = useMemo(() => {
    return portfolios
      .map((p) => {
        const txs = txByPortfolio.get(p.id) ?? [];
        const stats = calculateHoldingStats(txs);
        // 실시간 시세 우선, fallback으로 최근 매수가
        const currentPrice = quotes.get(p.ticker) ?? getLatestBuyPrice(txs);
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
      .filter((h) => h.stats.quantity > 0 || !txByPortfolio.has(h.id));
  }, [portfolios, txByPortfolio, quotes]);

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

  // 투자금 vs 평가금액 차트 데이터
  const comparisonData = holdings
    .filter((h) => h.stats.quantity > 0)
    .map((h) => ({
      name: h.ticker,
      invested: h.stats.totalInvested,
      marketValue: h.pnl.marketValue,
    }));

  return (
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

      {/* 투자금 vs 평가금액 차트 */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">투자금 vs 평가금액</CardTitle>
          </CardHeader>
          <CardContent>
            <InvestmentComparisonChart data={comparisonData} />
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground mt-4 text-center text-xs">
        *{" "}
        {quotesLoading
          ? "실시간 시세를 불러오는 중입니다..."
          : quotes.size > 0
            ? "yfinance 기반 실시간 시세가 반영되었습니다."
            : "현재가는 최근 매수 가격을 기준으로 표시됩니다."}{" "}
        투자 판단의 참고 자료로만 활용해주세요.
      </p>
    </main>
  );
}
