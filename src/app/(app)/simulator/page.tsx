import type { Metadata } from "next";

import { FlaskConical } from "lucide-react";
import { SimulatorContent } from "./simulator-client";

export const metadata: Metadata = {
  title: "시나리오 시뮬레이션",
  description: "금리·환율·지정학 시나리오별 What-if AI 분석",
};

export default function SimulatorPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <FlaskConical className="size-6" />
          시나리오 시뮬레이션
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          거시경제 + 지정학 What-if 분석
        </p>
      </div>

      <SimulatorContent />
    </div>
  );
}
