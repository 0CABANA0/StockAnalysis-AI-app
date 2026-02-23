"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AssetAllocationChart,
  HoldingsPnLChart,
} from "@/components/charts/portfolio-charts";
import { useStockQuotes } from "@/hooks/use-stock-quotes";
import {
  calculateHoldingStats,
  calculateUnrealizedPnL,
  getLatestBuyPrice,
} from "@/lib/portfolio/calculations";
import type { Portfolio, Transaction, MarketType } from "@/types";

interface PerformanceContentProps {
  portfolios: Portfolio[];
  transactions: Transaction[];
}

export function PerformanceContent({
  portfolios,
  transactions,
}: PerformanceContentProps) {
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
  const tickers = useMemo(
    () => portfolios.map((p) => p.ticker),
    [portfolios],
  );

  // 실시간 시세 조회
  const { quotes, loading: quotesLoading } = useStockQuotes(tickers);

  // 종목별 성과 계산
  const holdings = useMemo(() => {
    return portfolios
      .map((p) => {
        const txs = txByPortfolio.get(p.id) ?? [];
        const stats = calculateHoldingStats(txs);
        const currentPrice = quotes.get(p.ticker) ?? getLatestBuyPrice(txs);
        const pnl = calculateUnrealizedPnL(stats, currentPrice);
        return {
          ticker: p.ticker,
          companyName: p.company_name,
          market: p.market as MarketType,
          stats,
          pnl,
        };
      })
      .filter((h) => h.stats.quantity > 0);
  }, [portfolios, txByPortfolio, quotes]);

  const totalInvested = holdings.reduce(
    (sum, h) => sum + h.stats.totalInvested,
    0,
  );
  const totalMarketValue = holdings.reduce(
    (sum, h) => sum + h.pnl.marketValue,
    0,
  );
  const totalPnL = totalMarketValue - totalInvested;
  const totalPnLPercent =
    totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // 시장별 분포
  const marketChartData = useMemo(() => {
    const dist: Record<string, number> = {};
    for (const h of holdings) {
      dist[h.market] = (dist[h.market] ?? 0) + h.pnl.marketValue;
    }
    return Object.entries(dist).map(([name, value]) => ({ name, value }));
  }, [holdings]);

  // 종목별 손익률 차트 데이터
  const pnlChartData = holdings.map((h) => ({
    name: h.ticker,
    pnlPercent: h.pnl.unrealizedPnLPercent,
  }));

  // 최고/최저 수익 종목
  const sortedByPnL = [...holdings].sort(
    (a, b) => b.pnl.unrealizedPnL - a.pnl.unrealizedPnL,
  );
  const topPerformer = sortedByPnL[0] ?? null;
  const worstPerformer = sortedByPnL[sortedByPnL.length - 1] ?? null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">성과 분석</h1>
        <p className="text-muted-foreground text-sm">
          포트폴리오 성과와 자산 분포를 확인하세요.
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 투자금</CardTitle>
            <BarChart3 className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalInvested.toLocaleString("ko-KR")}원
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평가금액</CardTitle>
            <PieChartIcon className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalMarketValue.toLocaleString("ko-KR")}원
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 손익</CardTitle>
            {totalPnL >= 0 ? (
              <TrendingUp className="size-4 text-green-500" />
            ) : (
              <TrendingDown className="size-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${totalPnL >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {totalPnL >= 0 ? "+" : ""}
              {totalPnL.toLocaleString("ko-KR")}원
            </div>
            <p
              className={`text-xs ${totalPnLPercent >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {totalPnLPercent >= 0 ? "+" : ""}
              {totalPnLPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">보유 종목</CardTitle>
            <BarChart3 className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{holdings.length}개</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 시장별 분포 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">시장별 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <AssetAllocationChart data={marketChartData} />
          </CardContent>
        </Card>

        {/* 최고/최저 수익 종목 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top / Worst</CardTitle>
          </CardHeader>
          <CardContent>
            {!topPerformer ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                보유 종목이 없습니다.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 p-4 dark:border-green-800">
                  <div className="mb-1 text-xs font-medium text-green-600">
                    최고 수익
                  </div>
                  <div className="font-medium">
                    {topPerformer.ticker}{" "}
                    <span className="text-muted-foreground text-sm">
                      {topPerformer.companyName}
                    </span>
                  </div>
                  <div className="text-sm text-green-600">
                    {topPerformer.pnl.unrealizedPnL >= 0 ? "+" : ""}
                    {topPerformer.pnl.unrealizedPnL.toLocaleString("ko-KR")}원 (
                    {topPerformer.pnl.unrealizedPnLPercent >= 0 ? "+" : ""}
                    {topPerformer.pnl.unrealizedPnLPercent.toFixed(2)}%)
                  </div>
                </div>
                {worstPerformer && worstPerformer !== topPerformer && (
                  <div className="rounded-lg border border-red-200 p-4 dark:border-red-800">
                    <div className="mb-1 text-xs font-medium text-red-600">
                      최저 수익
                    </div>
                    <div className="font-medium">
                      {worstPerformer.ticker}{" "}
                      <span className="text-muted-foreground text-sm">
                        {worstPerformer.companyName}
                      </span>
                    </div>
                    <div className="text-sm text-red-600">
                      {worstPerformer.pnl.unrealizedPnL >= 0 ? "+" : ""}
                      {worstPerformer.pnl.unrealizedPnL.toLocaleString(
                        "ko-KR",
                      )}
                      원 (
                      {worstPerformer.pnl.unrealizedPnLPercent >= 0 ? "+" : ""}
                      {worstPerformer.pnl.unrealizedPnLPercent.toFixed(2)}%)
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 종목별 손익률 차트 */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">종목별 손익률</CardTitle>
          </CardHeader>
          <CardContent>
            <HoldingsPnLChart data={pnlChartData} />
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground mt-6 text-center text-xs">
        *{" "}
        {quotesLoading
          ? "실시간 시세를 불러오는 중입니다..."
          : quotes.size > 0
            ? "yfinance 기반 실시간 시세가 반영되었습니다."
            : "현재가는 최근 매수 가격 기준이며, 실제 수익과 차이가 있을 수 있습니다."}{" "}
        투자 판단의 책임은 본인에게 있습니다.
      </p>
    </main>
  );
}
