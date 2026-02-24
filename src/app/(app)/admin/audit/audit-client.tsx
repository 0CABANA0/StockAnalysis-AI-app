"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAuditLogs, type AuditLog } from "@/lib/api/admin";
import { FileText } from "lucide-react";

const actionLabel: Record<string, string> = {
  ROLE_CHANGE: "역할 변경",
  NOTIFICATION_SEND: "알림 발송",
  MODEL_CONFIG_CHANGE: "모델 설정 변경",
  LOGIN: "로그인",
  BLOCKED: "접근 차단",
};

const actionColor: Record<string, string> = {
  ROLE_CHANGE: "bg-blue-100 text-blue-700",
  NOTIFICATION_SEND: "bg-green-100 text-green-700",
  MODEL_CONFIG_CHANGE: "bg-yellow-100 text-yellow-700",
  LOGIN: "bg-gray-100 text-gray-700",
  BLOCKED: "bg-red-100 text-red-700",
};

export function AuditContent() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs(200)
      .then((res) => setLogs(res.logs))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="size-4" />
          감사 로그 ({logs.length}건)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            감사 로그가 없습니다.
          </p>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-background sticky top-0">
                <tr className="text-muted-foreground border-b text-xs">
                  <th className="py-2 text-left">일시</th>
                  <th className="py-2 text-left">액션</th>
                  <th className="py-2 text-left">관리자 ID</th>
                  <th className="py-2 text-left">대상 ID</th>
                  <th className="py-2 text-left">상세</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b">
                    <td className="text-muted-foreground py-2 text-xs">
                      {new Date(log.created_at).toLocaleString("ko-KR")}
                    </td>
                    <td className="py-2">
                      <Badge
                        className={`text-xs ${actionColor[log.action_type] ?? ""}`}
                        variant="outline"
                      >
                        {actionLabel[log.action_type] ?? log.action_type}
                      </Badge>
                    </td>
                    <td className="py-2 font-mono text-xs">
                      {log.admin_id
                        ? `${log.admin_id.slice(0, 8)}...`
                        : "—"}
                    </td>
                    <td className="py-2 font-mono text-xs">
                      {log.target_user_id
                        ? `${log.target_user_id.slice(0, 8)}...`
                        : "—"}
                    </td>
                    <td className="max-w-[200px] truncate py-2 text-xs">
                      {log.detail
                        ? JSON.stringify(log.detail)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
