"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminStats, type AdminStats } from "@/lib/api/admin";
import { fetchHealth, type HealthResponse } from "@/lib/api/health";
import {
  Users,
  Bell,
  FileText,
  Activity,
  ChevronRight,
} from "lucide-react";

export function AdminDashboardContent() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminStats().catch(() => null),
      fetchHealth().catch(() => null),
    ]).then(([s, h]) => {
      setStats(s);
      setHealth(h);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "총 사용자",
      value: stats?.user_count ?? 0,
      icon: Users,
      href: "/admin/members",
    },
    {
      title: "알림 발송",
      value: stats?.notification_count ?? 0,
      icon: Bell,
      href: "/admin/notifications",
    },
    {
      title: "감사 로그",
      value: stats?.audit_count ?? 0,
      icon: FileText,
      href: "/admin/audit",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:bg-accent/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <card.icon className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {card.value.toLocaleString()}
                  </span>
                  <ChevronRight className="text-muted-foreground size-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 시스템 상태 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4" />
              백엔드 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span
                className={`size-3 rounded-full ${
                  health?.status === "ok" ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="font-medium">
                {health?.status === "ok" ? "정상 운영 중" : "오프라인"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">최근 데이터 수집</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">거시경제</span>
                <span>
                  {stats?.last_macro_at
                    ? new Date(stats.last_macro_at).toLocaleString("ko-KR")
                    : "수집 이력 없음"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">감성 분석</span>
                <span>
                  {stats?.last_sentiment_at
                    ? new Date(stats.last_sentiment_at).toLocaleString("ko-KR")
                    : "수집 이력 없음"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
