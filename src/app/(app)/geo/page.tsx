import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { GeoRisksList } from "./geo-client";

export const metadata: Metadata = {
  title: "지정학 리스크",
  description: "글로벌 지정학 이벤트 실시간 추적 및 투자 영향 분석",
};

export default function GeoPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Shield className="size-5" />}
        title="지정학 리스크"
        description="지정학 이벤트 모니터링"
      />

      {/* 리스크 대응 매트릭스 */}
      <Card className="transition-shadow duration-200 hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="size-4" />
            리스크 대응 가이드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block size-3 rounded-full bg-emerald-500" />
              <span className="font-medium">낮음</span>
              <span className="text-muted-foreground">
                — 정상 투자 유지, 적립식 매수 계속
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block size-3 rounded-full bg-amber-400" />
              <span className="font-medium">보통</span>
              <span className="text-muted-foreground">
                — 현금 비중 10~20% 확보, 방어적 섹터 비중 확대
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block size-3 rounded-full bg-orange-500" />
              <span className="font-medium">높음</span>
              <span className="text-muted-foreground">
                — 신규 매수 보류, 기존 포지션 일부 축소
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block size-3 rounded-full bg-red-500" />
              <span className="font-medium">매우 높음</span>
              <span className="text-muted-foreground">
                — 위험자산 최소화, 안전자산 중심, 관망
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 리스크 목록 — 동적 */}
      <GeoRisksList />
    </div>
  );
}
