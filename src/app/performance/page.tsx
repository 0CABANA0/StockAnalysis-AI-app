import { Header } from "@/components/layout/header";
import { PerformanceContent } from "@/components/performance/performance-content";
import { serverApiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/server";
import type { Portfolio, Transaction } from "@/types";

export const metadata = {
  title: "성과 분석 | StockAnalysis AI",
};

interface PortfolioListResponse {
  portfolios: Portfolio[];
  total: number;
}

interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
}

export default async function PerformancePage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let portfolios: Portfolio[] = [];
  let transactions: Transaction[] = [];

  if (session?.access_token) {
    try {
      const [portfolioResult, txResult] = await Promise.all([
        serverApiFetch<PortfolioListResponse>(
          "/portfolio/my",
          session.access_token,
        ),
        serverApiFetch<TransactionListResponse>(
          "/portfolio/my/transactions",
          session.access_token,
        ),
      ]);
      portfolios = portfolioResult.portfolios;
      transactions = txResult.transactions;
    } catch {
      // API 에러 — 빈 상태 표시
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <PerformanceContent
        portfolios={portfolios}
        transactions={transactions}
      />
    </div>
  );
}
