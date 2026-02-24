"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { StatusDot } from "@/components/ui/status-dot";
import { getAdminStats, type AdminStats } from "@/lib/api/admin";
import { fetchHealth, type HealthResponse } from "@/lib/api/health";
import {
  Users,
  Bell,
  FileText,
  Cpu,
  Activity,
  Settings,
  Clock,
  ChevronRight,
} from "lucide-react";

interface QuickAction {
  title: string;
  icon: React.ElementType;
  href: string;
  description: string;
}

const quickActions: QuickAction[] = [
  {
    title: "회원 관리",
    icon: Users,
    href: "/admin/members",
    description: "사용자 역할 및 상태 관리",
  },
  {
    title: "알림 발송",
    icon: Bell,
    href: "/admin/notifications",
    description: "텔레그램 알림 발송",
  },
  {
    title: "감사 로그",
    icon: FileText,
    href: "/admin/audit",
    description: "시스템 활동 이력 조회",
  },
  {
    title: "시스템 설정",
    icon: Settings,
    href: "/admin/settings",
    description: "스케줄러 및 시스템 설정",
  },
  {
    title: "AI 모델",
    icon: Cpu,
    href: "/admin/settings/models",
    description: "AI 모델 배정 및 파라미터",
  },
  {
    title: "알림 기록",
    icon: Clock,
    href: "/admin/notifications/history",
    description: "발송 이력 및 성공/실패",
  },
];

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
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 상단 통계 그리드 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="총 사용자"
          value={stats?.user_count ?? 0}
          icon={<Users className="size-5" />}
          href="/admin/members"
        />
        <StatCard
          title="알림 발송"
          value={stats?.notification_count ?? 0}
          icon={<Bell className="size-5" />}
          href="/admin/notifications"
        />
        <StatCard
          title="감사 로그"
          value={stats?.audit_count ?? 0}
          icon={<FileText className="size-5" />}
          href="/admin/audit"
        />
        <StatCard
          title="활성 모델"
          value="—"
          icon={<Cpu className="size-5" />}
          href="/admin/settings/models"
        />
      </div>

      {/* 시스템 상태 + 최근 활동 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4" />
              시스템 상태
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <StatusDot
                status={health?.status === "ok" ? "online" : "offline"}
                label={
                  health?.status === "ok"
                    ? "백엔드 — 정상 운영 중"
                    : "백엔드 — 오프라인"
                }
              />
              {health?.timestamp && (
                <p className="text-muted-foreground text-xs">
                  마지막 확인:{" "}
                  {new Date(health.timestamp).toLocaleString("ko-KR")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4" />
              최근 데이터 수집
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">거시경제 수집</span>
                <span className="font-medium">
                  {stats?.last_macro_at
                    ? new Date(stats.last_macro_at).toLocaleString("ko-KR")
                    : "수집 이력 없음"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">감성 분석</span>
                <span className="font-medium">
                  {stats?.last_sentiment_at
                    ? new Date(stats.last_sentiment_at).toLocaleString("ko-KR")
                    : "수집 이력 없음"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 액션 그리드 */}
      <div>
        <h2 className="mb-3 text-base font-semibold">빠른 액션</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-primary/20">
                    <action.icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{action.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {action.description}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
