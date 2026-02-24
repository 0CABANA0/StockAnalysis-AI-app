import Link from "next/link";
import { Users, Bell, ScrollText, Settings } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { serverApiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/server";
import { BackendStatus } from "@/components/admin/backend-status";

export const metadata = {
  title: "관리자 | StockAnalysis AI",
};

interface AdminStatsResponse {
  user_count: number;
  notification_count: number;
  audit_count: number;
  last_macro_at: string | null;
  last_sentiment_at: string | null;
}

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let userCount = 0;
  let notificationCount = 0;
  let auditCount = 0;
  let lastMacroAt: string | null = null;
  let lastSentimentAt: string | null = null;

  if (session?.access_token) {
    try {
      const stats = await serverApiFetch<AdminStatsResponse>(
        "/admin/stats",
        session.access_token,
      );
      userCount = stats.user_count;
      notificationCount = stats.notification_count;
      auditCount = stats.audit_count;
      lastMacroAt = stats.last_macro_at;
      lastSentimentAt = stats.last_sentiment_at;
    } catch {
      // API 에러 — 빈 상태 표시
    }
  }

  const adminLinks = [
    {
      label: "회원 관리",
      description: "사용자 목록, 역할 변경, 정지 처리",
      href: "/admin/members",
      icon: Users,
      stat: `${userCount}명`,
    },
    {
      label: "알림 관리",
      description: "알림 발송, 대상 그룹 관리",
      href: "/admin/notifications",
      icon: Bell,
      stat: `${notificationCount}건`,
    },
    {
      label: "감사 로그",
      description: "사용자 액션, 접근 시도 이력",
      href: "/admin/audit",
      icon: ScrollText,
      stat: `${auditCount}건`,
    },
    {
      label: "시스템 설정",
      description: "AI 모델, 일반 설정 관리",
      href: "/admin/settings",
      icon: Settings,
      stat: "",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">관리자 패널</h1>
          <p className="text-muted-foreground text-sm">
            시스템 관리 및 사용자 관리
          </p>
        </div>

        {/* 백엔드 상태 */}
        <BackendStatus
          lastMacroAt={lastMacroAt}
          lastSentimentAt={lastSentimentAt}
        />

        {/* 통계 카드 */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
              <Users className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userCount}명</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">발송 알림</CardTitle>
              <Bell className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{notificationCount}건</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">감사 로그</CardTitle>
              <ScrollText className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditCount}건</div>
            </CardContent>
          </Card>
        </div>

        {/* 관리 메뉴 */}
        <div className="grid gap-4 sm:grid-cols-2">
          {adminLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
                <CardContent className="flex items-start gap-4 pt-6">
                  <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <link.icon className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{link.label}</h3>
                      {link.stat && (
                        <span className="text-muted-foreground text-sm">
                          {link.stat}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {link.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
