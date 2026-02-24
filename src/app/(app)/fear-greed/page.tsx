import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge } from "lucide-react";

export const metadata: Metadata = {
  title: "공포/탐욕 지수 | Stock Intelligence",
};

export default function FearGreedPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gauge className="size-6" />
          공포 / 탐욕 지수
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          시장 심리 지수 + 지정학 리스크 병행 분석
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center p-12">
          <div className="relative flex size-40 items-center justify-center rounded-full border-8 border-yellow-400">
            <div className="text-center">
              <p className="text-4xl font-bold">—</p>
              <p className="text-muted-foreground text-sm">데이터 대기</p>
            </div>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            0 극단적 공포 ← → 100 극단적 탐욕
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
