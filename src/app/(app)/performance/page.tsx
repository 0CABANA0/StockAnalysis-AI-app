import type { Metadata } from "next";

import { Activity } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PerformanceContent } from "./performance-client";

export const metadata: Metadata = {
  title: "성과 분석",
  description: "다중 종목 Sharpe Ratio, MDD, 롤링 수익률 비교 분석",
};

export default function PerformancePage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Activity className="size-5" />}
        title="성과 분석"
        description="Sharpe Ratio · MDD · 롤링 수익률 · 상관관계 비교"
      />
      <PerformanceContent />
    </div>
  );
}
