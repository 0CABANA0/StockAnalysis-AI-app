import type { Metadata } from "next";

import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReportContent } from "./report-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  return {
    title: `${date} 주간 리포트`,
    description: `${date} 주간 거시경제+지정학 종합 리포트`,
  };
}

export default async function WeeklyReportPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <FileText className="size-6" />
          주간 종합 리포트
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          <Badge variant="outline" className="mr-2">
            {date}
          </Badge>
          거시경제 + 지정학 주간 요약 및 다음 주 전략
        </p>
      </div>
      <ReportContent date={date} />
    </div>
  );
}
