import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "투자 가이드 | Stock Intelligence",
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

      <Card>
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <TrendingUp className="text-muted-foreground mb-3 size-12" />
          <h3 className="font-semibold">가이드 준비 중</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            백엔드 스케줄러가 매일 07:30 KST에 가이드를 자동 생성합니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
