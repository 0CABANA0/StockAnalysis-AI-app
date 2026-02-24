import type { Metadata } from "next";

import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EtfContent } from "./etf-client";

export const metadata: Metadata = {
  title: "ETF 스크리너",
  description: "ETF 검색, 비교, 테마별 추천 및 지정학 헷지 전략",
};

export default function EtfPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<BarChart3 className="size-5" />}
        title="ETF 스크리너"
        description="조건 검색 및 비교"
      />
      <EtfContent />
    </div>
  );
}
