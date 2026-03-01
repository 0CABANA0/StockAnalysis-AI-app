import type { Metadata } from "next";

import { Briefcase } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PortfolioContent } from "./portfolio-client";

export const metadata: Metadata = {
  title: "포트폴리오",
  description: "보유 종목, 거래 내역, 수익률 관리",
};

export default function PortfolioPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Briefcase className="size-5" />}
        title="포트폴리오"
        description="보유 종목 관리 · 거래 기록 · 배당금 · 수익률 통계"
      />
      <PortfolioContent />
    </div>
  );
}
