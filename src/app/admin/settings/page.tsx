import Link from "next/link";
import { Settings, Cpu } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "시스템 설정 | StockAnalysis AI",
};

export default function AdminSettingsPage() {
  const settingsLinks = [
    {
      label: "AI 모델 관리",
      description: "기능별 AI 모델 배정, 파라미터 조정",
      href: "/admin/settings/models",
      icon: Cpu,
    },
    {
      label: "일반 설정",
      description: "시스템 일반 설정 (준비 중)",
      href: "#",
      icon: Settings,
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">시스템 설정</h1>
          <p className="text-muted-foreground text-sm">
            AI 모델 및 시스템 설정 관리
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {settingsLinks.map((link) => {
            const content = (
              <Card
                className={
                  link.disabled
                    ? "cursor-not-allowed opacity-60"
                    : "hover:bg-muted/50 cursor-pointer transition-colors"
                }
              >
                <CardContent className="flex items-start gap-4 pt-6">
                  <div className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <link.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">{link.label}</h3>
                    <p className="text-muted-foreground text-sm">
                      {link.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );

            if (link.disabled) {
              return <div key={link.label}>{content}</div>;
            }

            return (
              <Link key={link.label} href={link.href}>
                {content}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
