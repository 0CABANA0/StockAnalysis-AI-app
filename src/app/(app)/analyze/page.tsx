import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { Camera } from "lucide-react";

export const metadata: Metadata = {
  title: "이미지 분석 | Stock Intelligence",
};

export default function AnalyzePage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Camera className="size-6" />
          보유 종목 이미지 분석
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          증권사 캡처 이미지를 업로드하면 AI가 보유 종목을 분석하고 매수/매도/홀딩 가이드를 제공합니다
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center p-12 text-center">
          <Camera className="text-muted-foreground mb-3 size-12" />
          <p className="font-semibold">이미지를 업로드하세요</p>
          <p className="text-muted-foreground mt-1 text-sm">
            국내/해외/ETF 모두 인식 가능합니다
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
