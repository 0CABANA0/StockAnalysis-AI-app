import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "종목 가이드 | Stock Intelligence",
};

export default async function TickerGuidePage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <Badge variant="outline" className="mb-2">{ticker}</Badge>
        <h1 className="text-2xl font-bold">{ticker} 투자 가이드</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          거시+지정학+기술적 분석 종합 가이드
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">거시경제 분석</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">분석 대기 중</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">지정학 영향</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">분석 대기 중</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">기술적 지표</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">분석 대기 중</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
