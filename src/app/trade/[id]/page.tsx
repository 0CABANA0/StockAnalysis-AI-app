import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { calculateHoldingStats } from "@/lib/portfolio/calculations";
import { TradeStats } from "@/components/portfolio/trade-stats";
import { TradeForm } from "@/components/portfolio/trade-form";
import { TransactionHistory } from "@/components/portfolio/transaction-history";
import type { MarketType, Portfolio, Transaction } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: portfolio } = await supabase
    .from("portfolio")
    .select("ticker, company_name")
    .eq("id", id)
    .eq("is_deleted", false)
    .returns<Pick<Portfolio, "ticker" | "company_name">[]>()
    .single();

  if (!portfolio) {
    return { title: "종목을 찾을 수 없음 | StockAnalysis AI" };
  }

  return {
    title: `${portfolio.ticker} ${portfolio.company_name} 거래 | StockAnalysis AI`,
  };
}

export default async function TradePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 포트폴리오 조회 (소유권 확인)
  const { data: portfolio } = await supabase
    .from("portfolio")
    .select("*")
    .eq("id", id)
    .eq("user_id", user!.id)
    .eq("is_deleted", false)
    .returns<Portfolio[]>()
    .single();

  if (!portfolio) {
    notFound();
  }

  // 거래 이력 조회
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("portfolio_id", id)
    .eq("user_id", user!.id)
    .order("trade_date", { ascending: true })
    .returns<Transaction[]>();

  const txList = transactions ?? [];
  const stats = calculateHoldingStats(txList);
  const market = portfolio.market as MarketType;

  return (
    <div className="min-h-screen">
      <Header />
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
          <h1 className="text-2xl font-bold">{portfolio.ticker}</h1>
          <span className="text-muted-foreground text-lg">
            {portfolio.company_name}
          </span>
          <Badge variant="secondary">{portfolio.market}</Badge>
        </div>

        <div className="mb-8">
          <TradeStats stats={stats} market={market} />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <TradeForm portfolioId={id} ticker={portfolio.ticker} />
          <TransactionHistory
            transactions={txList}
            portfolioId={id}
            market={market}
          />
        </div>

        <p className="text-muted-foreground mt-8 text-center text-xs">
          * 매도 시 세금(한국 시장 0.20%)이 자동 계산됩니다. 투자 참고용이며
          책임은 본인에게 있습니다.
        </p>
      </main>
    </div>
  );
}
