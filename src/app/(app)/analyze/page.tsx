import type { Metadata } from "next";

import { Camera } from "lucide-react";
import { AnalyzeContent } from "./analyze-client";

export const metadata: Metadata = {
  title: "이미지 분석",
  description: "보유 자산 이미지를 업로드하면 AI가 진단 및 가이드 제공",
};

export default function AnalyzePage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Camera className="size-6" />
          보유 종목 이미지 분석
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          증권사 캡처 이미지를 업로드하면 AI가 보유 종목을 분석하고
          매수/매도/홀딩 가이드를 제공합니다
        </p>
      </div>
      <AnalyzeContent />
    </div>
  );
}
