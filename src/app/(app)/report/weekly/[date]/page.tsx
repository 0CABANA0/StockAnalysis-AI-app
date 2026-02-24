import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "주간 리포트 | Stock Intelligence",
};

export default async function WeeklyReportPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <Badge variant="outline" className="mb-2">{date}</Badge>
        <h1 className="text-2xl font-bold">주간 종합 리포트</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          거시경제 + 지정학 주간 요약 및 다음 주 전략
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm text-center">
            백엔드 연동 후 주간 리포트가 표시됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
