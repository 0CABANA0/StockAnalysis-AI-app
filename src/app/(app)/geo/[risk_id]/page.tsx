import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "리스크 상세 | Stock Intelligence",
};

export default async function GeoRiskDetailPage({
  params,
}: {
  params: Promise<{ risk_id: string }>;
}) {
  const { risk_id } = await params;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <Badge variant="outline" className="mb-2">{risk_id}</Badge>
        <h1 className="text-2xl font-bold">지정학 리스크 상세</h1>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm">
            백엔드 연동 후 상세 분석 데이터가 표시됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
