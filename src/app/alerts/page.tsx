import { Bell, BellRing } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { AlertsTable } from "@/components/alerts/alerts-table";
import { AddAlertDialog } from "@/components/alerts/add-alert-dialog";
import type { PriceAlert } from "@/types";

export const metadata = {
  title: "알림 | StockAnalysis AI",
};

export default async function AlertsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: alerts } = await supabase
    .from("price_alerts")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<PriceAlert[]>();

  const allAlerts = alerts ?? [];
  const activeCount = allAlerts.filter((a) => !a.is_triggered).length;
  const triggeredCount = allAlerts.filter((a) => a.is_triggered).length;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">알림</h1>
            <p className="text-muted-foreground text-sm">
              가격 알림을 설정하고 관리하세요.
            </p>
          </div>
          <AddAlertDialog />
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 알림</CardTitle>
              <Bell className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}개</div>
              <p className="text-muted-foreground text-xs">대기중인 알림</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">발동된 알림</CardTitle>
              <BellRing className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{triggeredCount}개</div>
              <p className="text-muted-foreground text-xs">
                조건이 충족된 알림
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border">
          <AlertsTable alerts={allAlerts} />
        </div>

        <p className="text-muted-foreground mt-4 text-center text-xs">
          * 알림은 투자 참고용이며, 최종 투자 판단의 책임은 본인에게 있습니다.
        </p>
      </main>
    </div>
  );
}
