import { notFound } from "next/navigation";

import { Header } from "@/components/layout/header";
import { TradeContent } from "@/components/portfolio/trade-content";
import { serverApiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/server";
import type { Distribution, Portfolio, Transaction } from "@/types";

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

interface PortfolioDetailApiResponse {
  portfolio: Portfolio;
  transactions: Transaction[];
  distributions: Distribution[];
  stats: {
    avg_price: number;
    quantity: number;
    total_invested: number;
    total_fees: number;
    realized_pnl: number;
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
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    notFound();
  }

  let detail: PortfolioDetailApiResponse;
  try {
    detail = await serverApiFetch<PortfolioDetailApiResponse>(
      `/portfolio/${encodeURIComponent(id)}/detail`,
      session.access_token,
    );
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <Header />
      <TradeContent
        portfolio={detail.portfolio}
        transactions={detail.transactions}
        distributions={detail.distributions}
      />
    </div>
  );
}
