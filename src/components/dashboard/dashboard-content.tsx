"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview";
import {
  RecentHoldings,
  type DashboardHolding,
} from "@/components/dashboard/recent-holdings";
import { MacroOverview } from "@/components/dashboard/macro-overview";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { AssetAllocationChart } from "@/components/charts/portfolio-charts";
import { useStockQuotes } from "@/hooks/use-stock-quotes";
import {
  calculateHoldingStats,
  calculateUnrealizedPnL,
  getLatestBuyPrice,
} from "@/lib/portfolio/calculations";
import type {
  MarketType,
  Portfolio,
  Transaction,
  MacroSnapshot,
} from "@/types";

const roleBadgeStyles: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  ADMIN:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  USER: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "슈퍼 관리자",
  ADMIN: "관리자",
  USER: "일반 사용자",
};

interface DashboardContentProps {
  portfolios: Portfolio[];
  transactions: Transaction[];
  macroSnapshot: MacroSnapshot | null;
  displayName: string;
  role: string;
}

export function DashboardContent({
  portfolios,
  transactions,
  macroSnapshot,
  displayName,
  role,
}: DashboardContentProps) {
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

  // 고유 티커 목록
  const tickers = useMemo(() => portfolios.map((p) => p.ticker), [portfolios]);

  // 실시간 시세 조회
  const { quotes, loading: quotesLoading } = useStockQuotes(tickers);

  // 보유 종목 데이터 계산
  const holdings: DashboardHolding[] = useMemo(() => {
    return portfolios
      .map((p) => {
        const txs = txByPortfolio.get(p.id) ?? [];
        const stats = calculateHoldingStats(txs);
        const currentPrice = quotes.get(p.ticker) ?? getLatestBuyPrice(txs);
        const pnl = calculateUnrealizedPnL(stats, currentPrice);

        return {
          id: p.id,
          ticker: p.ticker,
          companyName: p.company_name,
          market: p.market as MarketType,
          stats,
          pnl,
        };
      })
      .filter((h) => h.stats.quantity > 0);
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
  const holdingCount = holdings.length;

  // 시장별 자산 배분 데이터
  const marketAllocation = useMemo(() => {
    const dist: Record<string, number> = {};
    for (const h of holdings) {
      dist[h.market] = (dist[h.market] ?? 0) + h.pnl.marketValue;
    }
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [holdings]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* 타이틀 + 역할 배지 */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">대시보드</h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeStyles[role] || roleBadgeStyles.USER}`}
          >
            {roleLabels[role] || role}
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          안녕하세요, {displayName}님. 투자 현황을 확인하세요.
        </p>
      </div>

      {/* 포트폴리오 요약 카드 4개 */}
      <div className="mb-8">
        <PortfolioOverview
          totalInvested={totalInvested}
          totalMarketValue={totalMarketValue}
          totalUnrealizedPnL={totalUnrealizedPnL}
          totalUnrealizedPnLPercent={totalUnrealizedPnLPercent}
          holdingCount={holdingCount}
        />
      </div>

      {/* 2컬럼: 보유 종목 | 거시 지표 */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <RecentHoldings holdings={holdings} />
        <MacroOverview snapshot={macroSnapshot} />
      </div>

      {/* 자산 배분 차트 */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">자산 배분</CardTitle>
          </CardHeader>
          <CardContent>
            <AssetAllocationChart data={marketAllocation} />
          </CardContent>
        </Card>
      </div>

      {/* 빠른 액션 */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">빠른 액션</h2>
        <QuickActions />
      </div>

      {/* 면책 문구 */}
      <p className="text-muted-foreground text-center text-xs">
        {quotesLoading
          ? "실시간 시세를 불러오는 중입니다..."
          : quotes.size > 0
            ? "yfinance 기반 실시간 시세가 반영되었습니다."
            : "현재가는 최근 매수 가격 기준입니다."}{" "}
        본 서비스는 투자 참고용이며, 투자 판단에 따른 책임은 본인에게 있습니다.
      </p>
    </main>
  );
}
