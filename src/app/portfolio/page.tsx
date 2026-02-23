import { Header } from "@/components/layout/header";
import { PortfolioContent } from "@/components/portfolio/portfolio-content";
import { createClient } from "@/lib/supabase/server";
import type { Portfolio, Transaction } from "@/types";

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

  return (
    <div className="min-h-screen">
      <Header />
      <PortfolioContent
        portfolios={portfolios ?? []}
        transactions={allTransactions ?? []}
      />
    </div>
  );
}
