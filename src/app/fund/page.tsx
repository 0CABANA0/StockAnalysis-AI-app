import { Landmark } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { EtfFundTable } from "@/components/etf-fund/etf-fund-table";
import type { EtfFundMaster } from "@/types";

export const metadata = {
  title: "펀드 | StockAnalysis AI",
};

export default async function FundPage() {
  const supabase = await createClient();

  const { data: funds } = await supabase
    .from("etf_fund_master")
    .select("*")
    .eq("asset_type", "DOMESTIC_FUND")
    .eq("is_active", true)
    .order("aum", { ascending: false, nullsFirst: false })
    .returns<EtfFundMaster[]>();

  const allFunds = funds ?? [];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">펀드</h1>
          <p className="text-muted-foreground text-sm">
            국내 공모펀드 NAV 및 성과 데이터를 확인하세요.
          </p>
        </div>

        <div className="mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">등록 펀드</CardTitle>
              <Landmark className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allFunds.length}개</div>
              <p className="text-muted-foreground text-xs">KOFIA 데이터 기반</p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border">
          <EtfFundTable
            items={allFunds}
            emptyLabel="등록된 펀드가 없습니다"
            emptyDescription="KOFIA API에서 펀드 데이터가 수집되면 표시됩니다."
          />
        </div>

        <p className="text-muted-foreground mt-4 text-center text-xs">
          * 펀드 정보는 투자 참고용이며, 최종 투자 판단의 책임은 본인에게
          있습니다.
        </p>
      </main>
    </div>
  );
}
