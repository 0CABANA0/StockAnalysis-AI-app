"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Camera,
  Target,
  Menu,
} from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "홈", icon: LayoutDashboard },
  { href: "/guide", label: "가이드", icon: TrendingUp },
  { href: "/analyze", label: "분석", icon: Camera },
  { href: "/recommend", label: "추천", icon: Target },
  { href: "/more", label: "더보기", icon: Menu },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();

  // 인증 페이지에서는 탭바 숨김
  if (pathname.startsWith("/auth")) return null;

  return (
    <nav className="bg-background/95 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex h-14 items-center justify-around">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/more"
              ? false
              : pathname === tab.href ||
                (tab.href !== "/dashboard" && pathname.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground",
              )}
            >
              <tab.icon className="size-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {/* 하단 Safe area */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
