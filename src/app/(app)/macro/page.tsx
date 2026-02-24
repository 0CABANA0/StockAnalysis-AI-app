import type { Metadata } from "next";

import { BarChart3 } from "lucide-react";
import { MacroContent } from "./macro-client";

export const metadata: Metadata = {
  title: "거시경제",
  description: "GDP, CPI, 금리, VIX 등 40+ 거시경제 지표 추세 분석",
};

export default function MacroPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BarChart3 className="size-6" />
          거시경제 지표 모니터링
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          글로벌 지수, 환율, 원자재, 금리 실시간 추적
        </p>
      </div>

      <MacroContent />
    </div>
  );
}
