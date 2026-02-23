import { History } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import type { NotificationHistory } from "@/types";

export const metadata = {
  title: "알림 발송 이력 | StockAnalysis AI",
};

const targetTypeBadge: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  INDIVIDUAL: { label: "개인", variant: "outline" },
  GROUP: { label: "그룹", variant: "secondary" },
  BROADCAST: { label: "전체", variant: "default" },
};

export default async function NotificationHistoryPage() {
  const supabase = await createClient();

  const { data: history } = await supabase
    .from("notification_history")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(50)
    .returns<NotificationHistory[]>();

  const allHistory = history ?? [];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">알림 발송 이력</h1>
          <p className="text-muted-foreground text-sm">
            발송된 알림 히스토리 (최근 50건)
          </p>
        </div>

        <div className="rounded-lg border">
          {allHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
                <History className="text-muted-foreground size-8" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">
                발송 이력이 없습니다
              </h3>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>대상 유형</TableHead>
                  <TableHead>그룹</TableHead>
                  <TableHead>메시지</TableHead>
                  <TableHead className="text-right">성공</TableHead>
                  <TableHead className="text-right">실패</TableHead>
                  <TableHead>발송일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allHistory.map((h) => {
                  const typeBadge =
                    targetTypeBadge[h.target_type] ??
                    targetTypeBadge.INDIVIDUAL;

                  return (
                    <TableRow key={h.id}>
                      <TableCell>
                        <Badge variant={typeBadge.variant}>
                          {typeBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {h.target_group ?? "-"}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm">
                        {h.message}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {h.success_count}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {h.fail_count}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(h.sent_at).toLocaleString("ko-KR")}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
