import type { Metadata } from "next";

import { Star } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WatchlistContent } from "./watchlist-client";

export const metadata: Metadata = {
  title: "관심종목",
  description: "나의 관심종목 관리 및 실시간 모니터링",
};

export default function WatchlistPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Star className="size-5" />}
        title="관심종목"
        description="내 관심종목 관리"
      />
      <WatchlistContent />
    </div>
  );
}
