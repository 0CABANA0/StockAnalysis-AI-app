import type { Metadata } from "next";

import { FlaskConical } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SimulatorContent } from "./simulator-client";

export const metadata: Metadata = {
  title: "시나리오 시뮬레이션",
  description: "금리·환율·지정학 시나리오별 What-if AI 분석",
};

export default function SimulatorPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<FlaskConical className="size-5" />}
        title="시나리오 시뮬레이션"
        description="What-if 분석"
      />
      <SimulatorContent />
    </div>
  );
}
