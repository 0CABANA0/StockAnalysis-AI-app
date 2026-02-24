import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "지표 상세 | Stock Intelligence",
};

export default async function MacroIndicatorPage({
  params,
}: {
  params: Promise<{ indicator_id: string }>;
}) {
  const { indicator_id } = await params;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <Badge variant="outline" className="mb-2">{indicator_id}</Badge>
        <h1 className="text-2xl font-bold">거시경제 지표 상세</h1>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm">
            백엔드 연동 후 지표 데이터 및 차트가 표시됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
