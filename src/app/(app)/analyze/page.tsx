import type { Metadata } from "next";

import { ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AnalyzeContent } from "./analyze-client";

export const metadata: Metadata = {
  title: "이미지 분석",
  description: "보유 자산 이미지를 업로드하면 AI가 진단 및 가이드 제공",
};

export default function AnalyzePage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<ImageIcon className="size-5" />}
        title="이미지 분석"
        description="보유 자산 스크린샷으로 AI 진단"
      />
      <AnalyzeContent />
    </div>
  );
}
