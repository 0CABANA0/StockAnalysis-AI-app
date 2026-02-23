import { notFound } from "next/navigation";

import { Header } from "@/components/layout/header";
import { TradeContent } from "@/components/portfolio/trade-content";
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

  // 포트폴리오 + 거래 + 분배금 병렬 조회
  const [portfolioResult, txResult, distResult] = await Promise.all([
    supabase
      .from("portfolio")
      .select("*")
      .eq("id", id)
      .eq("user_id", user!.id)
      .eq("is_deleted", false)
      .returns<Portfolio[]>()
      .single(),
    supabase
      .from("transactions")
      .select("*")
      .eq("portfolio_id", id)
      .eq("user_id", user!.id)
      .order("trade_date", { ascending: true })
      .returns<Transaction[]>(),
    supabase
      .from("distributions")
      .select("*")
      .eq("portfolio_id", id)
      .eq("user_id", user!.id)
      .order("record_date", { ascending: true })
      .returns<Distribution[]>(),
  ]);

  if (!portfolioResult.data) {
    notFound();
  }

  return (
    <div className="min-h-screen">
      <Header />
      <TradeContent
        portfolio={portfolioResult.data}
        transactions={txResult.data ?? []}
        distributions={distResult.data ?? []}
      />
    </div>
  );
}
