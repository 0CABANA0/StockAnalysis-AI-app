import type { Metadata } from "next";

import { BarChart3 } from "lucide-react";
import { IndicatorContent } from "./indicator-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ indicator_id: string }>;
}): Promise<Metadata> {
  const { indicator_id } = await params;
  return {
    title: `${indicator_id} 지표 상세`,
    description: `거시경제 지표 "${indicator_id}" 상세 데이터 및 추세 분석`,
  };
}

export default async function MacroIndicatorPage({
  params,
}: {
  params: Promise<{ indicator_id: string }>;
}) {
  const { indicator_id } = await params;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BarChart3 className="size-6" />
          거시경제 지표 상세
        </h1>
      </div>
      <IndicatorContent indicatorId={indicator_id} />
    </div>
  );
}
