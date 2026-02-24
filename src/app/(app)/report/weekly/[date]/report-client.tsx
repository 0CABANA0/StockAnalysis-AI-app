"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { FileText } from "lucide-react";

interface WeeklyReportData {
  id: string;
  week_start_date: string;
  macro_summary: string | null;
  geo_summary: string | null;
  next_week_outlook: string | null;
  strategy_guide: string | null;
  created_at: string;
}

export function ReportContent({ date }: { date: string }) {
  const [report, setReport] = useState<WeeklyReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // weekly_reports 테이블에서 직접 조회
    apiFetch<{ reports: WeeklyReportData[] }>(
      `/guide/weekly?date=${encodeURIComponent(date)}`,
    )
      .then((res) => setReport(res.reports?.[0] ?? null))
      .catch(() => {
        // 단일 리포트 조회 시도
        apiFetch<WeeklyReportData>(
          `/guide/weekly/${encodeURIComponent(date)}`,
        )
          .then(setReport)
          .catch(() => setReport(null));
      })
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

  return (
    <div className="space-y-4">
      {report.macro_summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">거시경제 주간 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {report.macro_summary}
            </p>
          </CardContent>
        </Card>
      )}

      {report.geo_summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">지정학 상황 요약</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {report.geo_summary}
            </p>
          </CardContent>
        </Card>
      )}

      {report.next_week_outlook && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">다음 주 전망</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {report.next_week_outlook}
            </p>
          </CardContent>
        </Card>
      )}

      {report.strategy_guide && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">투자 전략 가이드</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {report.strategy_guide}
            </p>
          </CardContent>
        </Card>
      )}

      <p className="text-muted-foreground text-right text-xs">
        생성일: {new Date(report.created_at).toLocaleString("ko-KR")}
      </p>
    </div>
  );
}
