import { redirect } from "next/navigation";

import { Header } from "@/components/layout/header";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { serverApiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/server";
import type { Portfolio, Transaction, MacroSnapshot } from "@/types";

export const metadata = {
  title: "대시보드 | StockAnalysis AI",
};

interface UserMeResponse {
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
}

interface PortfolioListResponse {
  portfolios: Portfolio[];
  total: number;
}

interface TransactionListResponse {
  transactions: Transaction[];
  total: number;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/auth/login");
  }

  let displayName = session.user.email || "";
  let role = "USER";
  let portfolios: Portfolio[] = [];
  let transactions: Transaction[] = [];
  let macroSnapshot: MacroSnapshot | null = null;

  try {
    const [userResult, portfolioResult, txResult, macroResult] =
      await Promise.allSettled([
        serverApiFetch<UserMeResponse>("/user/me", session.access_token),
        serverApiFetch<PortfolioListResponse>(
          "/portfolio/my",
          session.access_token,
        ),
        serverApiFetch<TransactionListResponse>(
          "/portfolio/my/transactions",
          session.access_token,
        ),
        serverApiFetch<MacroSnapshot>("/macro/latest", session.access_token),
      ]);

    if (userResult.status === "fulfilled") {
      displayName = userResult.value.display_name || session.user.email || "";
      role = userResult.value.role;
    }

    if (portfolioResult.status === "fulfilled") {
      portfolios = portfolioResult.value.portfolios;
    }

    if (txResult.status === "fulfilled") {
      transactions = txResult.value.transactions;
    }

    if (macroResult.status === "fulfilled") {
      macroSnapshot = macroResult.value;
    }
  } catch {
    // API 에러 — 빈 상태 표시
  }

  return (
    <div className="min-h-screen">
      <Header />
      <DashboardContent
        portfolios={portfolios}
        transactions={transactions}
        macroSnapshot={macroSnapshot}
        displayName={displayName}
        role={role}
      />
    </div>
  );
}
