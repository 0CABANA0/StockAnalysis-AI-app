import type { Metadata } from "next";

import { GuideContent } from "./guide-client";

export const metadata: Metadata = {
  title: "투자 가이드",
  description: "거시경제+지정학 분석 기반 매수·매도·홀딩 투자 가이드",
};

export default function GuidePage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">오늘의 투자 액션 가이드</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          거시경제 + 지정학 분석 기반 매수/매도/홀딩 가이드
        </p>
      </div>

      <GuideContent />
    </div>
  );
}
