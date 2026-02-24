import type { Metadata } from "next";

import { ArrowLeftRight } from "lucide-react";
import { CompareContent } from "./compare-client";

export const metadata: Metadata = {
  title: "ETF 비교",
};

export default function EtfComparePage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <ArrowLeftRight className="size-6" />
          ETF 비교
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          2~3개 ETF의 수수료, 배당률, 구성 종목 차이 비교
        </p>
      </div>
      <CompareContent />
    </div>
  );
}
