import type { Metadata } from "next";

import { LineChart } from "lucide-react";
import { EtfContent } from "./etf-client";

export const metadata: Metadata = {
  title: "ETF 스크리너",
  description: "ETF 검색, 비교, 테마별 추천 및 지정학 헷지 전략",
};

export default function EtfPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <LineChart className="size-6" />
          ETF 스크리너
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          조건 검색, ETF 비교, 테마별 추천, 지정학 헷지 ETF
        </p>
      </div>
      <EtfContent />
    </div>
  );
}
