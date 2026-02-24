import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "ETF 스크리너 | Stock Intelligence",
};

export default function EtfPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LineChart className="size-6" />
          ETF 스크리너
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          조건 검색, ETF 비교, 테마별 추천, 지정학 헷지 ETF
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">초보자 추천</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              처음 투자한다면 이 ETF부터
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">테마별 ETF</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              반도체, AI, 클린에너지, 방산 등
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">지정학 헷지</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              금, 방산, 에너지, 사이버보안
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
