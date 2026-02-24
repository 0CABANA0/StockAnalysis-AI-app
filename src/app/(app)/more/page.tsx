import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import {
  BarChart3,
  Globe,
  LineChart,
  Gauge,
  Calendar,
  FlaskConical,
  BookOpen,
  MessageCircle,
  Star,
  Settings,
} from "lucide-react";

export const metadata: Metadata = {
  title: "더보기",
  description: "추가 기능 및 설정 메뉴",
};

const menuItems = [
  { href: "/macro", label: "거시경제", icon: BarChart3 },
  { href: "/geo", label: "지정학 리스크", icon: Globe },
  { href: "/etf", label: "ETF 스크리너", icon: LineChart },
  { href: "/fear-greed", label: "공포/탐욕 지수", icon: Gauge },
  { href: "/calendar", label: "경제 캘린더", icon: Calendar },
  { href: "/simulator", label: "시나리오", icon: FlaskConical },
  { href: "/glossary", label: "용어사전", icon: BookOpen },
  { href: "/ask", label: "AI Q&A", icon: MessageCircle },
  { href: "/watchlist", label: "관심종목", icon: Star },
];

export default function MorePage() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="text-2xl font-bold">더보기</h1>
      <div className="grid gap-2">
        {menuItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:bg-accent transition-colors">
              <CardContent className="flex items-center gap-3 p-3">
                <item.icon className="text-muted-foreground size-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
