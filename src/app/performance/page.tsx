import { Header } from "@/components/layout/header";
import { PerformanceContent } from "@/components/performance/performance-content";
import { createClient } from "@/lib/supabase/server";
import type { Portfolio, Transaction } from "@/types";

export const metadata = {
  title: "성과 분석 | StockAnalysis AI",
};

export default async function PerformancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [portfolioResult, txResult] = await Promise.all([
    supabase
      .from("portfolio")
      .select("*")
      .eq("user_id", user!.id)
      .eq("is_deleted", false)
      .returns<Portfolio[]>(),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user!.id)
      .order("trade_date", { ascending: true })
      .returns<Transaction[]>(),
  ]);

  return (
    <div className="min-h-screen">
      <Header />
      <PerformanceContent
        portfolios={portfolioResult.data ?? []}
        transactions={txResult.data ?? []}
      />
    </div>
  );
}
