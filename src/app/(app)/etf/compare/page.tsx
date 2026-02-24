import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "ETF 비교 | Stock Intelligence",
};

export default function EtfComparePage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">ETF 비교</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          2~3개 ETF의 수수료, 배당률, 구성 종목 차이 비교
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm text-center">
            비교할 ETF를 선택해주세요.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
