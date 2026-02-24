import type { Metadata } from "next";

import { Gauge } from "lucide-react";
import { FearGreedContent } from "./fear-greed-client";

export const metadata: Metadata = {
  title: "공포/탐욕 지수",
  description: "시장 심리 0~100 공포탐욕지수 실시간 모니터링",
};

export default function FearGreedPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Gauge className="size-6" />
          공포 / 탐욕 지수
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          시장 심리 지수 + 지정학 리스크 병행 분석
        </p>
      </div>

      <FearGreedContent />
    </div>
  );
}
