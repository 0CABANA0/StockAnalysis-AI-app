import { BarChart3 } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import type { Portfolio } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  return { title: `${ticker} 차트 | StockAnalysis AI` };
}

export default async function ChartPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const decodedTicker = decodeURIComponent(ticker).toUpperCase();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 포트폴리오에서 종목 정보 조회
  const { data: portfolio } = await supabase
    .from("portfolio")
    .select("*")
    .eq("user_id", user!.id)
    .eq("ticker", decodedTicker)
    .eq("is_deleted", false)
    .returns<Portfolio[]>()
    .maybeSingle();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{decodedTicker}</h1>
            {portfolio && <Badge variant="secondary">{portfolio.market}</Badge>}
          </div>
          <p className="text-muted-foreground text-sm">
            {portfolio?.company_name ?? decodedTicker} — 기술적 분석 차트
          </p>
        </div>

        {/* 차트 영역 — 백엔드 연동 후 TradingView Lightweight Charts 적용 예정 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">캔들스틱 차트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[400px] flex-col items-center justify-center rounded-lg border border-dashed">
              <BarChart3 className="text-muted-foreground mb-4 size-12" />
              <p className="text-muted-foreground text-sm font-medium">
                차트 데이터 준비 중
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                백엔드(FastAPI + yfinance) 연동 후 TradingView 차트가
                표시됩니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 기술적 지표 카드 */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "RSI (14)",
              value: "-",
              description: "과매수/과매도 지표",
            },
            { label: "MACD", value: "-", description: "추세 전환 시그널" },
            {
              label: "볼린저밴드",
              value: "-",
              description: "변동성 상/하한선",
            },
            {
              label: "이동평균",
              value: "-",
              description: "20일 / 60일 / 120일",
            },
          ].map((indicator) => (
            <Card key={indicator.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {indicator.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-2xl font-bold">
                  {indicator.value}
                </div>
                <p className="text-muted-foreground text-xs">
                  {indicator.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-muted-foreground text-center text-xs">
          * 기술적 지표는 투자 참고용이며, 최종 투자 판단의 책임은 본인에게
          있습니다.
        </p>
      </main>
    </div>
  );
}
