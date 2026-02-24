import type { Metadata } from "next";

import { Gauge } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { FearGreedContent } from "./fear-greed-client";

export const metadata: Metadata = {
  title: "공포/탐욕 지수",
  description: "시장 심리 0~100 공포탐욕지수 실시간 모니터링",
};

export default function FearGreedPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Gauge className="size-5" />}
        title="공포/탐욕 지수"
        description="시장 심리 지표"
      />
      <FearGreedContent />
    </div>
  );
}
