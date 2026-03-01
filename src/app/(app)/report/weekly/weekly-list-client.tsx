"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, ChevronRight } from "lucide-react";
import { listWeeklyReports, type WeeklyReportItem } from "@/lib/api/guide";

/** 주간 리포트 목록 위젯 (클라이언트 컴포넌트). */
export function WeeklyReportList() {
  const [reports, setReports] = useState<WeeklyReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listWeeklyReports(12)
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center p-12 text-center">
          <FileText className="text-muted-foreground mb-3 size-12" />
          <p className="font-semibold">주간 리포트가 아직 없습니다</p>
          <p className="text-muted-foreground mt-1 text-sm">
            매주 일요일 21:00 (KST)에 자동 생성됩니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-2">
      {reports.map((r) => {
        const weekEnd = addDays(r.week_start_date, 6);
        return (
          <Link key={r.id} href={`/report/weekly/${r.week_start_date}`}>
            <Card className="group transition-all duration-200 hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-3">
                <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {formatDate(r.week_start_date)} ~ {formatDate(weekEnd)}
                    </span>
                    {isThisWeek(r.week_start_date) && (
                      <Badge variant="secondary" className="text-[10px]">
                        최신
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    생성: {new Date(r.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <ChevronRight className="text-muted-foreground size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}

// ─── 유틸 ───

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function isThisWeek(weekStart: string): boolean {
  const now = new Date();
  const ws = new Date(weekStart);
  const diff = now.getTime() - ws.getTime();
  return diff >= 0 && diff < 7 * 24 * 60 * 60 * 1000;
}
