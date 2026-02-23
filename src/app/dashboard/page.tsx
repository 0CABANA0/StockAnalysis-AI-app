import { redirect } from "next/navigation";

import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import {
  calculateHoldingStats,
  calculateUnrealizedPnL,
  getLatestBuyPrice,
} from "@/lib/portfolio/calculations";
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview";
import {
  RecentHoldings,
  type DashboardHolding,
} from "@/components/dashboard/recent-holdings";
import { MacroOverview } from "@/components/dashboard/macro-overview";
import { QuickActions } from "@/components/dashboard/quick-actions";
import type {
  MarketType,
  Portfolio,
  Transaction,
  MacroSnapshot,
} from "@/types";

const roleBadgeStyles: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  ADMIN:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  USER: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "슈퍼 관리자",
  ADMIN: "관리자",
  USER: "일반 사용자",
};

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

  // 프로필 조회
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, role")
    .eq("user_id", user.id)
    .returns<{ display_name: string | null; role: string }[]>()
    .single();

  const displayName = profile?.display_name || user.email;
  const role = profile?.role || "USER";

  // 포트폴리오 + 거래 + 거시 지표 병렬 조회
  const [portfolioResult, transactionsResult, macroResult] = await Promise.all([
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

  const portfolios = portfolioResult.data ?? [];
  const allTransactions = transactionsResult.data ?? [];
  const macroSnapshot = macroResult.data?.[0] ?? null;

  // 포트폴리오별 거래 그룹핑
  const txByPortfolio = new Map<string, Transaction[]>();
  for (const tx of allTransactions) {
    const list = txByPortfolio.get(tx.portfolio_id) ?? [];
    list.push(tx);
    txByPortfolio.set(tx.portfolio_id, list);
  }

  // 보유 종목 데이터 계산
  const holdings: DashboardHolding[] = portfolios
    .map((p) => {
      const transactions = txByPortfolio.get(p.id) ?? [];
      const stats = calculateHoldingStats(transactions);
      const currentPrice = getLatestBuyPrice(transactions);
      const pnl = calculateUnrealizedPnL(stats, currentPrice);

      return {
        id: p.id,
        ticker: p.ticker,
        companyName: p.company_name,
        market: p.market as MarketType,
        stats,
        pnl,
      };
    })
    .filter((h) => h.stats.quantity > 0);

  // 요약 데이터 집계
  const totalInvested = holdings.reduce(
    (sum, h) => sum + h.stats.totalInvested,
    0,
  );
  const totalMarketValue = holdings.reduce(
    (sum, h) => sum + h.pnl.marketValue,
    0,
  );
  const totalUnrealizedPnL = totalMarketValue - totalInvested;
  const totalUnrealizedPnLPercent =
    totalInvested > 0 ? (totalUnrealizedPnL / totalInvested) * 100 : 0;
  const holdingCount = holdings.length;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* 타이틀 + 역할 배지 */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">대시보드</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeStyles[role] || roleBadgeStyles.USER}`}
            >
              {roleLabels[role] || role}
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            안녕하세요, {displayName}님. 투자 현황을 확인하세요.
          </p>
        </div>

        {/* 포트폴리오 요약 카드 4개 */}
        <div className="mb-8">
          <PortfolioOverview
            totalInvested={totalInvested}
            totalMarketValue={totalMarketValue}
            totalUnrealizedPnL={totalUnrealizedPnL}
            totalUnrealizedPnLPercent={totalUnrealizedPnLPercent}
            holdingCount={holdingCount}
          />
        </div>

        {/* 2컬럼: 보유 종목 | 거시 지표 */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <RecentHoldings holdings={holdings} />
          <MacroOverview snapshot={macroSnapshot} />
        </div>

        {/* 빠른 액션 */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">빠른 액션</h2>
          <QuickActions />
        </div>

        {/* 면책 문구 */}
        <p className="text-muted-foreground text-center text-xs">
          본 서비스는 투자 참고용이며, 투자 판단에 따른 책임은 본인에게
          있습니다.
        </p>
      </main>
    </div>
  );
}
