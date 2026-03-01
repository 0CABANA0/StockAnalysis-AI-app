"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";
import { getWeeklyReport, type WeeklyReportDetail } from "@/lib/api/guide";

export function ReportContent({ date }: { date: string }) {
  const [report, setReport] = useState<WeeklyReportDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeeklyReport(date)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [date]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center p-12 text-center">
          <FileText className="text-muted-foreground mb-3 size-12" />
          <p className="font-semibold">해당 주간 리포트가 없습니다</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {date} 주간 리포트가 아직 생성되지 않았습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sections = [
    { title: "거시경제 주간 요약", content: report.macro_summary },
    { title: "지정학 상황 요약", content: report.geo_summary },
    { title: "다음 주 전망", content: report.next_week_outlook },
    { title: "투자 전략 가이드", content: report.strategy_guide },
  ];

  return (
    <div className="space-y-4">
      {sections
        .filter((s) => s.content)
        .map((s) => (
          <Card key={s.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm leading-relaxed">
                {s.content}
              </p>
            </CardContent>
          </Card>
        ))}

      <p className="text-muted-foreground text-right text-xs">
        생성일: {new Date(report.created_at).toLocaleString("ko-KR")}
      </p>
    </div>
  );
}
