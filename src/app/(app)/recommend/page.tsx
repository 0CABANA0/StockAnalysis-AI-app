import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";

export const metadata: Metadata = {
  title: "종목 추천 | Stock Intelligence",
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
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Target className="size-6" />
          종목 추천
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          거시경제 + 지정학 근거 기반 종목/ETF 추천
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {categories.map((cat) => (
          <Link key={cat.key} href={`/recommend/${cat.key}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{cat.flag}</p>
                <p className="font-semibold mt-1">{cat.label}</p>
                <p className="text-muted-foreground text-xs mt-1">{cat.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm text-center">
            백엔드 연동 후 거시+지정학 근거 기반 추천 종목이 표시됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
