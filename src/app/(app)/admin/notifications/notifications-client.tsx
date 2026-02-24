"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getNotificationGroups,
  sendNotification,
  type NotificationGroup,
} from "@/lib/api/admin";
import { Bell, Send } from "lucide-react";

export function NotificationsContent() {
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [targetCount, setTargetCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("ALL");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    getNotificationGroups()
      .then((res) => {
        setGroups(res.groups);
        setTargetCount(res.active_target_count);
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await sendNotification({
        target_type: targetType,
        message: message.trim(),
      });
      setResult(res.message);
      setMessage("");
    } catch (err) {
      setResult(
        err instanceof Error ? err.message : "알림 발송에 실패했습니다.",
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 알림 발송 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Send className="size-4" />
            알림 발송
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">대상</label>
              <div className="mt-1 flex gap-2">
                {["ALL", "GROUP"].map((t) => (
                  <Button
                    key={t}
                    variant={targetType === t ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTargetType(t)}
                  >
                    {t === "ALL" ? "전체" : "그룹"}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">메시지</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="border-input bg-background mt-1 w-full rounded-md border p-2 text-sm"
                rows={3}
                placeholder="알림 메시지를 입력하세요..."
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="w-full"
            >
              <Send className="mr-2 size-4" />
              {sending ? "발송 중..." : "알림 발송"}
            </Button>
            {result && (
              <p className="text-sm text-green-600">{result}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 알림 그룹 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4" />
            알림 그룹 ({groups.length}개)
          </CardTitle>
          <p className="text-muted-foreground text-xs">
            활성 대상: {targetCount}명
          </p>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              등록된 알림 그룹이 없습니다.
            </p>
          ) : (
            <div className="space-y-2">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <span className="font-medium">{g.group_code}</span>
                    {g.description && (
                      <p className="text-muted-foreground text-xs">
                        {g.description}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={g.is_active ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {g.is_active ? "활성" : "비활성"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
