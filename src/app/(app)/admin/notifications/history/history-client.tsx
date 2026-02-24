"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getNotificationHistory,
  type NotificationHistory,
} from "@/lib/api/admin";
import { Clock } from "lucide-react";

export function NotificationHistoryContent() {
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotificationHistory(100)
      .then((res) => setHistory(res.history))
      .catch(() => setHistory([]))
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
          <Clock className="size-4" />
          발송 이력 ({history.length}건)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            알림 발송 이력이 없습니다.
          </p>
        ) : (
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-background sticky top-0">
                <tr className="text-muted-foreground border-b text-xs">
                  <th className="py-2 text-left">발송일시</th>
                  <th className="py-2 text-left">대상</th>
                  <th className="py-2 text-left">메시지</th>
                  <th className="py-2 text-center">성공</th>
                  <th className="py-2 text-center">실패</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b">
                    <td className="text-muted-foreground py-2 text-xs">
                      {new Date(h.sent_at).toLocaleString("ko-KR")}
                    </td>
                    <td className="py-2">
                      <Badge variant="outline" className="text-xs">
                        {h.target_type}
                      </Badge>
                      {h.target_group && (
                        <span className="text-muted-foreground ml-1 text-xs">
                          {h.target_group}
                        </span>
                      )}
                    </td>
                    <td className="max-w-[300px] truncate py-2 text-xs">
                      {h.message}
                    </td>
                    <td className="py-2 text-center text-xs text-green-600">
                      {h.success_count}
                    </td>
                    <td className="py-2 text-center text-xs text-red-600">
                      {h.fail_count}
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
