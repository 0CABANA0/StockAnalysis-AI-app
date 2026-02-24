import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

export const metadata: Metadata = {
  title: "관심종목 | Stock Intelligence",
};

export default function WatchlistPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Star className="size-6" />
          관심종목
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          관심 종목을 등록하고 자동 가이드를 받으세요
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center p-12 text-center">
          <Star className="text-muted-foreground mb-3 size-12" />
          <p className="font-semibold">아직 등록된 관심종목이 없습니다</p>
          <p className="text-muted-foreground mt-1 text-sm">
            종목을 검색하여 관심 목록에 추가하세요
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
