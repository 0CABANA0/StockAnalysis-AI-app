"use client";

import { Newspaper } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SentimentResult } from "@/types";

const directionStyles: Record<
  string,
  { label: string; variant: "default" | "destructive" | "secondary" }
> = {
  BULLISH: { label: "긍정", variant: "default" },
  BEARISH: { label: "부정", variant: "destructive" },
  NEUTRAL: { label: "중립", variant: "secondary" },
};

const urgencyStyles: Record<string, { label: string; className: string }> = {
  LOW: { label: "낮음", className: "text-green-600" },
  MEDIUM: { label: "보통", className: "text-yellow-600" },
  HIGH: { label: "높음", className: "text-red-600" },
};

const categoryLabels: Record<string, string> = {
  MACRO_FINANCE: "거시경제",
  GEOPOLITICS: "지정학",
  TECH_INDUSTRY: "기술산업",
  ENERGY: "에너지",
  DOMESTIC_POLITICS: "국내정치",
  INTL_POLITICS: "국제정치",
  BREAKING_DISASTER: "속보재난",
  ECONOMIC_POLICY: "경제정책",
  LIFESTYLE_ASSET: "생활자산",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface SentimentTableProps {
  sentiments: SentimentResult[];
}

export function SentimentTable({ sentiments }: SentimentTableProps) {
  if (sentiments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <Newspaper className="text-muted-foreground size-8" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">감성 분석 결과 없음</h3>
        <p className="text-muted-foreground text-sm">
          뉴스 감성 분석이 수행되면 결과가 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>제목</TableHead>
          <TableHead>카테고리</TableHead>
          <TableHead>방향</TableHead>
          <TableHead className="text-right">점수</TableHead>
          <TableHead>긴급도</TableHead>
          <TableHead>영향 섹터</TableHead>
          <TableHead>분석일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sentiments.map((s) => {
          const dir = directionStyles[s.direction] ?? directionStyles.NEUTRAL;
          const urg = urgencyStyles[s.urgency] ?? urgencyStyles.LOW;

          return (
            <TableRow key={s.id}>
              <TableCell className="max-w-[250px]">
                {s.source_url ? (
                  <a
                    href={s.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:underline"
                  >
                    {s.source_title ?? "링크"}
                  </a>
                ) : (
                  <span className="text-sm">{s.source_title ?? "-"}</span>
                )}
              </TableCell>
              <TableCell>
                {s.news_category ? (
                  <Badge variant="outline" className="text-xs">
                    {categoryLabels[s.news_category] ?? s.news_category}
                  </Badge>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                <Badge variant={dir.variant}>{dir.label}</Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                {s.score.toFixed(2)}
              </TableCell>
              <TableCell>
                <span className={`text-sm font-medium ${urg.className}`}>
                  {urg.label}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {s.affected_sectors?.join(", ") ?? "-"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(s.analyzed_at)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
