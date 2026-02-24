import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import {
  TrendingUp,
  TrendingDown,
  Globe,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "대시보드 | Stock Intelligence",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/auth/login");

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* 글로벌 시장 현황 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">글로벌 시장 현황</h2>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[
            { name: "S&P 500", value: "—", change: "—" },
            { name: "나스닥", value: "—", change: "—" },
            { name: "코스피", value: "—", change: "—" },
            { name: "원/달러", value: "—", change: "—" },
          ].map((item) => (
            <Card key={item.name}>
              <CardContent className="p-3">
                <p className="text-muted-foreground text-xs">{item.name}</p>
                <p className="text-lg font-bold">{item.value}</p>
                <p className="text-muted-foreground text-xs">{item.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 신호등 시스템 */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4" />
              거시경제 신호
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="inline-block size-4 rounded-full bg-yellow-400" />
              <span className="text-sm">데이터 수집 대기 중</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="size-4" />
              지정학 리스크
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="inline-block size-4 rounded-full bg-yellow-400" />
              <span className="text-sm">데이터 수집 대기 중</span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 오늘의 액션 가이드 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">오늘의 액션 가이드</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="text-muted-foreground mb-2 size-8" />
            <p className="text-muted-foreground text-sm">
              아직 생성된 가이드가 없습니다. 백엔드 연동 후 자동 생성됩니다.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* 주요 이벤트 */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">오늘의 주요 이벤트</h2>
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground text-sm">
              등록된 이벤트가 없습니다.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
