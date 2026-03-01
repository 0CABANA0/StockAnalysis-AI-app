"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Camera,
  Target,
  Globe,
  BarChart3,
  Calendar,
  FlaskConical,
  Gauge,
  BookOpen,
  MessageCircle,
  Star,
  LineChart,
  FileText,
  Shield,
  Settings,
  Users,
  Bell,
  ClipboardList,
  Cpu,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Activity,
  Briefcase,
} from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/guide", label: "투자 가이드", icon: TrendingUp },
  { href: "/analyze", label: "이미지 분석", icon: Camera },
  { href: "/recommend", label: "종목 추천", icon: Target },
];

const analysisNavItems: NavItem[] = [
  { href: "/macro", label: "거시경제", icon: BarChart3 },
  { href: "/geo", label: "지정학 리스크", icon: Globe },
  { href: "/etf", label: "ETF 스크리너", icon: LineChart },
  { href: "/prediction", label: "종합 스코어링", icon: Crosshair },
  { href: "/performance", label: "성과 분석", icon: Activity },
  { href: "/fear-greed", label: "공포/탐욕 지수", icon: Gauge },
  { href: "/calendar", label: "경제 캘린더", icon: Calendar },
  { href: "/simulator", label: "시나리오", icon: FlaskConical },
];

const utilNavItems: NavItem[] = [
  { href: "/portfolio", label: "포트폴리오", icon: Briefcase },
  { href: "/alert", label: "가격 알림", icon: Bell },
  { href: "/report/weekly", label: "주간 리포트", icon: FileText },
  { href: "/ask", label: "AI Q&A", icon: MessageCircle },
  { href: "/glossary", label: "용어사전", icon: BookOpen },
  { href: "/chart/SPY", label: "차트", icon: LineChart },
];

const adminNavItems: NavItem[] = [
  { href: "/admin", label: "관리자", icon: Shield },
  { href: "/admin/members", label: "회원 관리", icon: Users },
  { href: "/admin/notifications", label: "알림 관리", icon: Bell },
  { href: "/admin/audit", label: "감사 로그", icon: ClipboardList },
  { href: "/admin/settings", label: "시스템 설정", icon: Settings },
  { href: "/admin/settings/models", label: "AI 모델", icon: Cpu },
];

function NavSection({
  title,
  items,
  collapsed,
  currentPath,
}: {
  title: string;
  items: NavItem[];
  collapsed: boolean;
  currentPath: string;
}) {
  return (
    <div className="space-y-1">
      {!collapsed && (
        <p className="text-muted-foreground px-3 py-1 text-xs font-semibold uppercase tracking-wider">
          {title}
        </p>
      )}
      {items.map((item) => {
        const isActive =
          currentPath === item.href ||
          (item.href !== "/dashboard" && currentPath.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
              collapsed && "justify-center px-2",
            )}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="size-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </div>
  );
}

interface SidebarProps {
  displayName: string;
  role: string;
  signOutAction: () => Promise<void>;
}

export function Sidebar({ displayName, role, signOutAction }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  return (
    <aside
      className={cn(
        "border-sidebar-border bg-sidebar text-sidebar-foreground hidden flex-col border-r md:flex",
        collapsed ? "w-16" : "w-60",
        "transition-[width] duration-200",
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-3">
        {!collapsed && (
          <Link href="/dashboard" className="text-sm font-bold">
            Stock Intelligence
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 overflow-y-auto p-2">
        <NavSection
          title="메인"
          items={mainNavItems}
          collapsed={collapsed}
          currentPath={pathname}
        />
        <NavSection
          title="분석"
          items={analysisNavItems}
          collapsed={collapsed}
          currentPath={pathname}
        />
        <NavSection
          title="도구"
          items={utilNavItems}
          collapsed={collapsed}
          currentPath={pathname}
        />
        {isAdmin && (
          <NavSection
            title="관리자"
            items={adminNavItems}
            collapsed={collapsed}
            currentPath={pathname}
          />
        )}
      </nav>

      {/* 관심종목 바로가기 */}
      <div className="border-t p-2">
        <Link
          href="/watchlist"
          className={cn(
            "text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            pathname === "/watchlist" &&
              "bg-primary/10 text-primary font-medium",
            collapsed && "justify-center px-2",
          )}
        >
          <Star className="size-4 shrink-0" />
          {!collapsed && <span>관심종목</span>}
        </Link>
      </div>

      {/* Theme toggle & User info & logout */}
      <div className="space-y-1 border-t p-3">
        <ThemeToggle collapsed={collapsed} />
        {!collapsed && (
          <p className="text-muted-foreground mt-2 truncate text-xs">
            {displayName}
          </p>
        )}
        <form action={signOutAction}>
          <Button
            variant="ghost"
            size="sm"
            type="submit"
            className={cn("w-full", collapsed && "px-2")}
          >
            <LogOut className="size-4" />
            {!collapsed && <span>로그아웃</span>}
          </Button>
        </form>
      </div>
    </aside>
  );
}
