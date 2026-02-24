import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const categoryNames: Record<string, string> = {
  domestic: "국내",
  us: "미국",
  japan: "일본",
  europe: "유럽",
  etf: "ETF",
};

export const metadata: Metadata = {
  title: "카테고리 추천 | Stock Intelligence",
};

export default async function RecommendCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const name = categoryNames[category] || category;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <Badge variant="outline" className="mb-2">{name}</Badge>
        <h1 className="text-2xl font-bold">{name} 종목 추천</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          거시+지정학 근거 기반 {name} 시장 추천
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm text-center">
            백엔드 연동 후 추천 종목이 표시됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
