import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "지정학 리스크 | Stock Intelligence",
};

export default function GeoPage() {
  const risks = [
    { id: "us-china-trade", title: "미중 무역분쟁 / 관세전쟁", level: "MODERATE" },
    { id: "us-china-tech", title: "미중 기술패권 경쟁", level: "MODERATE" },
    { id: "taiwan-strait", title: "대만해협 긴장", level: "LOW" },
    { id: "russia-ukraine", title: "러시아-우크라이나 전쟁", level: "HIGH" },
    { id: "middle-east", title: "중동 분쟁 (이스라엘-이란)", level: "MODERATE" },
    { id: "north-korea", title: "북한 리스크", level: "LOW" },
    { id: "south-china-sea", title: "남중국해 분쟁", level: "LOW" },
    { id: "supply-chain", title: "글로벌 공급망 교란", level: "MODERATE" },
  ];

  const levelColor: Record<string, string> = {
    LOW: "bg-green-500",
    MODERATE: "bg-yellow-400",
    HIGH: "bg-orange-500",
    CRITICAL: "bg-red-500",
  };

  const levelLabel: Record<string, string> = {
    LOW: "낮음",
    MODERATE: "보통",
    HIGH: "높음",
    CRITICAL: "매우 높음",
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="size-6" />
          지정학 리스크 모니터링
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          글로벌 지정학 이벤트 실시간 추적 및 투자 영향 분석
        </p>
      </div>

      {/* 리스크 대응 매트릭스 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4" />
            리스크 대응 가이드
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block size-3 rounded-full bg-green-500" />
              <span className="font-medium">낮음</span>
              <span className="text-muted-foreground">— 정상 투자 유지, 적립식 매수 계속</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block size-3 rounded-full bg-yellow-400" />
              <span className="font-medium">보통</span>
              <span className="text-muted-foreground">— 현금 비중 10~20% 확보, 방어적 섹터 비중 확대</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block size-3 rounded-full bg-orange-500" />
              <span className="font-medium">높음</span>
              <span className="text-muted-foreground">— 신규 매수 보류, 기존 포지션 일부 축소</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block size-3 rounded-full bg-red-500" />
              <span className="font-medium">매우 높음</span>
              <span className="text-muted-foreground">— 위험자산 최소화, 안전자산 중심, 관망</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 리스크 목록 */}
      <div className="grid gap-3">
        {risks.map((risk) => (
          <Card key={risk.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className={`inline-block size-3 rounded-full ${levelColor[risk.level]}`} />
                <span className="font-medium text-sm">{risk.title}</span>
              </div>
              <Badge variant="outline">{levelLabel[risk.level]}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
