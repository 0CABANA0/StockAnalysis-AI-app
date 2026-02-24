import type { Metadata } from "next";

import { Globe } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MacroContent } from "./macro-client";

export const metadata: Metadata = {
  title: "거시경제",
  description: "GDP, CPI, 금리, VIX 등 40+ 거시경제 지표 추세 분석",
};

export default function MacroPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Globe className="size-5" />}
        title="거시경제"
        description="글로벌 경제 지표 대시보드"
      />
      <MacroContent />
    </div>
  );
}
