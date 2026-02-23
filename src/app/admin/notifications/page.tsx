import Link from "next/link";
import { Bell, History, Users } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { NotificationGroup } from "@/types";

export const metadata = {
  title: "알림 관리 | StockAnalysis AI",
};

export default async function AdminNotificationsPage() {
  const supabase = await createClient();

  const [groupsResult, targetsResult] = await Promise.all([
    supabase
      .from("notification_groups")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<NotificationGroup[]>(),
    supabase
      .from("notification_targets")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  const groups = groupsResult.data ?? [];
  const activeTargetCount = targetsResult.count ?? 0;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">알림 관리</h1>
            <p className="text-muted-foreground text-sm">
              알림 그룹 및 발송 대상을 관리합니다.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/notifications/history">
              <History className="mr-2 size-4" />
              발송 이력
            </Link>
          </Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">알림 그룹</CardTitle>
              <Bell className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groups.length}개</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 대상</CardTitle>
              <Users className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeTargetCount}명</div>
            </CardContent>
          </Card>
        </div>

        <h2 className="mb-4 text-lg font-semibold">알림 그룹</h2>
        <div className="rounded-lg border">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
                <Bell className="text-muted-foreground size-8" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">
                등록된 그룹이 없습니다
              </h3>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>그룹 코드</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>자동 조건</TableHead>
                  <TableHead>생성일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-mono font-medium">
                      {group.group_code}
                    </TableCell>
                    <TableCell>{group.description}</TableCell>
                    <TableCell>
                      <Badge
                        variant={group.is_active ? "default" : "secondary"}
                      >
                        {group.is_active ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {group.auto_condition
                        ? JSON.stringify(group.auto_condition)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(group.created_at).toLocaleDateString("ko-KR")}
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
