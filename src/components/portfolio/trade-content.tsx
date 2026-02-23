"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TradeStats } from "@/components/portfolio/trade-stats";
import { TradeForm } from "@/components/portfolio/trade-form";
import { TransactionHistory } from "@/components/portfolio/transaction-history";
import { DistributionHistory } from "@/components/portfolio/distribution-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStockQuotes } from "@/hooks/use-stock-quotes";
import {
  calculateHoldingStats,
  calculateUnrealizedPnL,
  getLatestBuyPrice,
  formatCurrency,
  formatPercent,
} from "@/lib/portfolio/calculations";
import type { Distribution, MarketType, Portfolio, Transaction } from "@/types";

interface TradeContentProps {
  portfolio: Portfolio;
  transactions: Transaction[];
  distributions: Distribution[];
}

export function TradeContent({
  portfolio,
  transactions,
  distributions,
}: TradeContentProps) {
  const market = portfolio.market as MarketType;
  const ticker = portfolio.ticker;

  // 실시간 시세 조회
  const { quotes, loading: quotesLoading } = useStockQuotes([ticker]);

  // 보유 통계 + 손익 계산
  const { stats, pnl } = useMemo(() => {
    const s = calculateHoldingStats(transactions);
    const currentPrice = quotes.get(ticker) ?? getLatestBuyPrice(transactions);
    const p = calculateUnrealizedPnL(s, currentPrice);
    return { stats: s, pnl: p };
  }, [transactions, quotes, ticker]);

  const hasQuote = quotes.has(ticker);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/portfolio">
            <ArrowLeft className="mr-2 size-4" />
            포트폴리오로 돌아가기
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold">{ticker}</h1>
        <span className="text-muted-foreground text-lg">
          {portfolio.company_name}
        </span>
        <Badge variant="secondary">{portfolio.market}</Badge>
      </div>

      {/* 기존 통계 3개 */}
      <div className="mb-4">
        <TradeStats stats={stats} market={market} />
      </div>

      {/* 현재가 + 손익 카드 (보유 수량이 있을 때만) */}
      {stats.quantity > 0 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                현재가
                {quotesLoading && (
                  <span className="text-muted-foreground ml-1 text-xs">
                    로딩 중...
                  </span>
                )}
              </CardTitle>
              {hasQuote ? (
                <Badge variant="outline" className="text-[10px]">
                  실시간
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">
                  최근 매수가
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(pnl.currentPrice, market)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">평가 금액</CardTitle>
              <span className="text-muted-foreground text-xs">
                {stats.quantity.toLocaleString()}주
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(pnl.marketValue, market)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                미실현 손익
              </CardTitle>
              {pnl.unrealizedPnL >= 0 ? (
                <TrendingUp className="size-4 text-green-500" />
              ) : (
                <TrendingDown className="size-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${pnl.unrealizedPnL >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(pnl.unrealizedPnL, market)}
              </div>
              <p
                className={`text-xs ${pnl.unrealizedPnLPercent >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatPercent(pnl.unrealizedPnLPercent)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <TradeForm portfolioId={portfolio.id} ticker={ticker} />
        <TransactionHistory
          transactions={transactions}
          portfolioId={portfolio.id}
          market={market}
        />
      </div>

      <div className="mt-8">
        <DistributionHistory
          distributions={distributions}
          portfolioId={portfolio.id}
          market={market}
        />
      </div>

      <p className="text-muted-foreground mt-8 text-center text-xs">
        *{" "}
        {hasQuote
          ? "yfinance 기반 실시간 시세가 반영되었습니다."
          : "현재가는 최근 매수 가격 기준입니다."}{" "}
        매도 시 세금(한국 시장 0.20%)이 자동 계산됩니다. 투자 참고용이며 책임은
        본인에게 있습니다.
      </p>
    </main>
  );
}
