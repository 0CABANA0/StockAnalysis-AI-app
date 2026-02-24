import type { Metadata } from "next";

import { Target } from "lucide-react";
import { CategoryRecommendContent } from "./category-recommend-client";

const categoryNames: Record<string, string> = {
  domestic: "국내",
  us: "미국",
  japan: "일본",
  europe: "유럽",
  etf: "ETF",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const name = categoryNames[category] || category;
  return {
    title: `${name} 종목 추천`,
    description: `거시경제+지정학 근거 기반 ${name} 시장 추천`,
  };
}

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
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Target className="size-6" />
          {name} 종목 추천
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          거시+지정학 근거 기반 {name} 시장 추천
        </p>
      </div>
      <CategoryRecommendContent category={category} />
    </div>
  );
}
