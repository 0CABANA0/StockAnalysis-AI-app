import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RecommendContent } from "./recommend-client";

export const metadata: Metadata = {
  title: "종목 추천",
  description: "거시경제+지정학 근거 기반 국내·미국·일본·유럽·ETF 종목 추천",
};

export default function RecommendPage() {
  const categories = [
    { key: "domestic", label: "국내", flag: "KR", desc: "KOSPI/KOSDAQ 추천" },
    { key: "us", label: "미국", flag: "US", desc: "NYSE/NASDAQ 추천" },
    { key: "japan", label: "일본", flag: "JP", desc: "닛케이 225 추천" },
    { key: "europe", label: "유럽", flag: "EU", desc: "유로스톡스 50 추천" },
    { key: "etf", label: "ETF", flag: "ETF", desc: "글로벌 ETF 추천" },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<TrendingUp className="size-5" />}
        title="종목 추천"
        description="거시경제 근거 기반 추천"
      />

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {categories.map((cat) => (
          <Link key={cat.key} href={`/recommend/${cat.key}`}>
            <Card className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{cat.flag}</p>
                <p className="mt-1 font-semibold">{cat.label}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {cat.desc}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <RecommendContent />
    </div>
  );
}
