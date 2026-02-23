import { ScrollText } from "lucide-react";

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
import type { AuditLog } from "@/types";

export const metadata = {
  title: "감사 로그 | StockAnalysis AI",
};

const actionBadge: Record<
  string,
  "default" | "destructive" | "secondary" | "outline"
> = {
  BLOCKED: "destructive",
  LOGIN: "default",
  ROLE_CHANGE: "secondary",
};

export default async function AdminAuditPage() {
  const supabase = await createClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<AuditLog[]>();

  const allLogs = logs ?? [];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">감사 로그</h1>
          <p className="text-muted-foreground text-sm">
            시스템 액션 및 접근 시도 이력 (최근 100건)
          </p>
        </div>

        <div className="rounded-lg border">
          {allLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
                <ScrollText className="text-muted-foreground size-8" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">로그가 없습니다</h3>
              <p className="text-muted-foreground text-sm">
                시스템 활동이 기록되면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>액션</TableHead>
                  <TableHead>관리자 ID</TableHead>
                  <TableHead>대상 사용자</TableHead>
                  <TableHead>상세</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>시각</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge
                        variant={actionBadge[log.action_type] ?? "outline"}
                      >
                        {log.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[100px] truncate font-mono text-xs">
                      {log.admin_id ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[100px] truncate font-mono text-xs">
                      {log.target_user_id ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate text-sm">
                      {log.detail ? JSON.stringify(log.detail) : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {log.ip_address ?? "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(log.created_at).toLocaleString("ko-KR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </main>
    </div>
  );
}
