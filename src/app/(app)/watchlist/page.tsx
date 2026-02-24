import type { Metadata } from "next";

import { Star } from "lucide-react";
import { WatchlistContent } from "./watchlist-client";

export const metadata: Metadata = {
  title: "관심종목",
  description: "나의 관심종목 관리 및 실시간 모니터링",
};

export default function WatchlistPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Star className="size-6" />
          관심종목
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          관심 종목을 등록하고 자동 가이드를 받으세요
        </p>
      </div>

      <WatchlistContent />
    </div>
  );
}
