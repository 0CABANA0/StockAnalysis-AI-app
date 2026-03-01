import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import {
  BarChart3,
  Globe,
  LineChart,
  Gauge,
  Calendar,
  FlaskConical,
  FileText,
  BookOpen,
  MessageCircle,
  Star,
  Menu,
  ChevronRight,
  Crosshair,
  Activity,
  Briefcase,
  Bell,
} from "lucide-react";

export const metadata: Metadata = {
  title: "더보기",
  description: "추가 기능 및 설정 메뉴",
};

const menuItems = [
  { href: "/prediction", label: "종합 스코어링", icon: Crosshair, desc: "5개 시그널 기반 투자 판단" },
  { href: "/performance", label: "성과 분석", icon: Activity, desc: "다중 종목 성과 비교" },
  { href: "/portfolio", label: "포트폴리오", icon: Briefcase, desc: "보유 종목 · 거래 관리" },
  { href: "/alert", label: "가격 알림", icon: Bell, desc: "목표가 · 손절가 알림" },
  { href: "/macro", label: "거시경제", icon: BarChart3, desc: "글로벌 경제 지표" },
  { href: "/geo", label: "지정학 리스크", icon: Globe, desc: "지정학 이벤트 모니터링" },
  { href: "/etf", label: "ETF 스크리너", icon: LineChart, desc: "조건 검색 및 비교" },
  { href: "/fear-greed", label: "공포/탐욕 지수", icon: Gauge, desc: "시장 심리 지표" },
  { href: "/calendar", label: "경제 캘린더", icon: Calendar, desc: "주요 경제/지정학 일정" },
  { href: "/simulator", label: "시나리오", icon: FlaskConical, desc: "What-if 분석" },
  { href: "/report/weekly", label: "주간 리포트", icon: FileText, desc: "주간 종합 투자 전략" },
  { href: "/glossary", label: "용어사전", icon: BookOpen, desc: "투자 용어 학습" },
  { href: "/ask", label: "AI Q&A", icon: MessageCircle, desc: "AI 투자 질문" },
  { href: "/watchlist", label: "관심종목", icon: Star, desc: "관심종목 관리" },
];

export default function MorePage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Menu className="size-5" />}
        title="더보기"
        description="전체 메뉴"
      />
      <div className="grid gap-2">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="group transition-all duration-200 hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <item.icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">{item.label}</span>
                  <p className="text-muted-foreground text-xs">{item.desc}</p>
                </div>
                <ChevronRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
