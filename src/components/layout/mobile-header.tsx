"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

export function MobileHeader() {
  const pathname = usePathname();

  // 인증 페이지에서는 헤더 숨김
  if (pathname.startsWith("/auth")) return null;

  return (
    <header className="bg-background/95 sticky top-0 z-40 border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex h-12 items-center justify-between px-4">
        <Link href="/dashboard" className="text-sm font-bold">
          Stock Intelligence
        </Link>
        <Button variant="ghost" size="icon-xs" asChild>
          <Link href="/watchlist">
            <Bell className="size-4" />
          </Link>
        </Button>
      </div>
    </header>
  );
}
