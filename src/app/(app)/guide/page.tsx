import type { Metadata } from "next";

import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { GuideContent } from "./guide-client";

export const metadata: Metadata = {
  title: "투자 가이드",
  description: "거시경제+지정학 분석 기반 매수·매도·홀딩 투자 가이드",
};

export default function GuidePage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<BookOpen className="size-5" />}
        title="투자 가이드"
        description="거시경제 + 지정학 기반 종목별 투자 판단"
      />
      <GuideContent />
    </div>
  );
}
