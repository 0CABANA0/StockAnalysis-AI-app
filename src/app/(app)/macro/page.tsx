import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "거시경제 | Stock Intelligence",
};

export default function MacroPage() {
  const categories = [
    { key: "rates", title: "금리 & 통화정책", count: 8 },
    { key: "inflation", title: "물가 & 인플레이션", count: 7 },
    { key: "employment", title: "고용 & 경기", count: 10 },
    { key: "forex", title: "환율 & 외환", count: 6 },
    { key: "sentiment", title: "시장 심리 & 리스크", count: 8 },
    { key: "other", title: "부동산 & 기타", count: 5 },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="size-6" />
          거시경제 지표 모니터링
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          A~F 카테고리 40+ 거시경제 지표 실시간 추적
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Card key={cat.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{cat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{cat.count}개 지표</p>
              <p className="text-muted-foreground mt-1 text-xs">데이터 수집 대기 중</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
