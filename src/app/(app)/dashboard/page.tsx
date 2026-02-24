import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  MarketOverview,
  SignalSystem,
  TodayGuideSection,
  KeyEventsSection,
} from "./dashboard-client";

export const metadata: Metadata = {
  title: "대시보드",
  description: "글로벌 시장 현황, 거시·지정학 신호, 오늘의 투자 액션 한눈에",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/auth/login");

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 글로벌 시장 현황 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">글로벌 시장 현황</h2>
        <MarketOverview />
      </section>

      {/* 신호등 시스템 */}
      <section>
        <SignalSystem />
      </section>

      {/* 오늘의 액션 가이드 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">오늘의 액션 가이드</h2>
        <TodayGuideSection />
      </section>

      {/* 주요 이벤트 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">오늘의 주요 이벤트</h2>
        <KeyEventsSection />
      </section>
    </div>
  );
}
