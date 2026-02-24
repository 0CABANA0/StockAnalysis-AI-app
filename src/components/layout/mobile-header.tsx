"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

export function MobileHeader() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- next-themes hydration workaround
  useEffect(() => setMounted(true), []);

  // 인증 페이지에서는 헤더 숨김
  if (pathname.startsWith("/auth")) return null;

  return (
    <header className="bg-background/95 sticky top-0 z-40 border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex h-12 items-center justify-between px-4">
        <Link href="/dashboard" className="text-sm font-bold">
          Stock Intelligence
        </Link>
        <div className="flex items-center gap-1">
          {mounted && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "라이트 모드" : "다크 모드"}
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
          )}
          <Button variant="ghost" size="icon-xs" asChild>
            <Link href="/watchlist" aria-label="관심종목">
              <Bell className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
