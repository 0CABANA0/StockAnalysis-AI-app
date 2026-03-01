import type { Metadata } from "next";

import { Crosshair } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PredictionContent } from "./prediction-client";

export const metadata: Metadata = {
  title: "종합 스코어링",
  description: "5개 시그널 기반 종합 투자 판단 분석",
};

export default function PredictionPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Crosshair className="size-5" />}
        title="종합 스코어링"
        description="기술적·거시·감성·환율·지정학 5개 시그널 기반 투자 판단"
      />
      <PredictionContent />
    </div>
  );
}
