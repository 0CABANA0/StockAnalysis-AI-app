import { Header } from "@/components/layout/header";
import { PortfolioContent } from "@/components/portfolio/portfolio-content";
import { serverApiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/server";
import type { Portfolio, Transaction } from "@/types";

export const metadata = {
  title: "포트폴리오 | StockAnalysis AI",
};

interface PortfolioListResponse {
  portfolios: Portfolio[];
  total: number;
}

interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
}

export default async function PortfolioPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let portfolios: Portfolio[] = [];
  let allTransactions: Transaction[] = [];

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
      allTransactions = txResult.transactions;
    } catch {
      // API 에러 — 빈 상태 표시
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <PortfolioContent
        portfolios={portfolios}
        transactions={allTransactions}
      />
    </div>
  );
}
