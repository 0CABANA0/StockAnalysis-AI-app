import { redirect } from "next/navigation";

import { Header } from "@/components/layout/header";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { createClient } from "@/lib/supabase/server";
import type { Portfolio, Transaction, MacroSnapshot } from "@/types";

export const metadata = {
  title: "대시보드 | StockAnalysis AI",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 프로필 + 포트폴리오 + 거래 + 거시 지표 병렬 조회
  const [profileResult, portfolioResult, transactionsResult, macroResult] =
    await Promise.all([
      supabase
        .from("user_profiles")
        .select("display_name, role")
        .eq("user_id", user.id)
        .returns<{ display_name: string | null; role: string }[]>()
        .single(),
      supabase
        .from("portfolio")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })
        .returns<Portfolio[]>(),
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("trade_date", { ascending: true })
        .returns<Transaction[]>(),
      supabase
        .from("macro_snapshots")
        .select("*")
        .order("collected_at", { ascending: false })
        .limit(1)
        .returns<MacroSnapshot[]>(),
    ]);

  const displayName = profileResult.data?.display_name || user.email || "";
  const role = profileResult.data?.role || "USER";

  return (
    <div className="min-h-screen">
      <Header />
      <DashboardContent
        portfolios={portfolioResult.data ?? []}
        transactions={transactionsResult.data ?? []}
        macroSnapshot={macroResult.data?.[0] ?? null}
        displayName={displayName}
        role={role}
      />
    </div>
  );
}
