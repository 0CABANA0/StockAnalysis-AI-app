import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "용어사전 | Stock Intelligence",
};

export default function GlossaryPage() {
  const categories = [
    "거시경제",
    "기술적 분석",
    "지정학",
    "ETF/펀드",
    "투자 전략",
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="size-6" />
          초보자 용어사전
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          투자에 필요한 핵심 용어를 쉽게 설명합니다
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
        {categories.map((cat) => (
          <Card key={cat}>
            <CardContent className="p-4 text-center">
              <p className="font-semibold">{cat}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm text-center">
            백엔드 연동 후 용어 목록이 표시됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
