import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "차트 | Stock Intelligence",
};

export default async function ChartPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <Badge variant="outline" className="mb-2">{ticker}</Badge>
        <h1 className="text-2xl font-bold">{ticker} 차트</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          기술적 지표 (RSI / MACD / BB) 차트
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm text-center">
            백엔드 연동 후 TradingView 차트가 표시됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
