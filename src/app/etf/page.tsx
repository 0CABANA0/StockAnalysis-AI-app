import { BarChart3, TrendingUp } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { EtfFundTable } from "@/components/etf-fund/etf-fund-table";
import type { EtfFundMaster } from "@/types";

export const metadata = {
  title: "ETF | StockAnalysis AI",
};

export default async function EtfPage() {
  const supabase = await createClient();

  const { data: etfs } = await supabase
    .from("etf_fund_master")
    .select("*")
    .in("asset_type", ["DOMESTIC_ETF", "FOREIGN_ETF"])
    .eq("is_active", true)
    .order("aum", { ascending: false, nullsFirst: false })
    .returns<EtfFundMaster[]>();

  const allEtfs = etfs ?? [];
  const domesticCount = allEtfs.filter(
    (e) => e.asset_type === "DOMESTIC_ETF",
  ).length;
  const foreignCount = allEtfs.filter(
    (e) => e.asset_type === "FOREIGN_ETF",
  ).length;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">ETF</h1>
          <p className="text-muted-foreground text-sm">
            국내/해외 ETF 데이터를 확인하세요.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">국내 ETF</CardTitle>
              <BarChart3 className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{domesticCount}개</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">해외 ETF</CardTitle>
              <TrendingUp className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{foreignCount}개</div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border">
          <EtfFundTable
            items={allEtfs}
            emptyLabel="등록된 ETF가 없습니다"
            emptyDescription="백엔드에서 ETF 데이터가 수집되면 표시됩니다."
          />
        </div>

        <p className="text-muted-foreground mt-4 text-center text-xs">
          * ETF 정보는 투자 참고용이며, 최종 투자 판단의 책임은 본인에게
          있습니다.
        </p>
      </main>
    </div>
  );
}
