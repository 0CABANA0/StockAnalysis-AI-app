"use client";

import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Recommendation } from "@/types";

const marketBadgeVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  KOSPI: "default",
  KOSDAQ: "secondary",
  NYSE: "outline",
  NASDAQ: "outline",
};

function formatPrice(value: number | null): string {
  if (value === null) return "-";
  return value.toLocaleString("ko-KR");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatConfidence(score: number | null): string {
  if (score === null) return "-";
  return `${(score * 100).toFixed(0)}%`;
}

interface RecommendationsTableProps {
  recommendations: Recommendation[];
}

export function RecommendationsTable({
  recommendations,
}: RecommendationsTableProps) {
  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <Sparkles className="text-muted-foreground size-8" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">추천 종목이 없습니다</h3>
        <p className="text-muted-foreground text-sm">
          AI 분석이 완료되면 추천 종목이 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>종목</TableHead>
          <TableHead>시장</TableHead>
          <TableHead className="text-right">목표가</TableHead>
          <TableHead className="text-right">손절가</TableHead>
          <TableHead className="text-right">신뢰도</TableHead>
          <TableHead>전략</TableHead>
          <TableHead>추천 사유</TableHead>
          <TableHead>만료일</TableHead>
          <TableHead>생성일</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recommendations.map((rec) => (
          <TableRow key={rec.id}>
            <TableCell>
              <div>
                <div className="font-medium">{rec.ticker}</div>
                <div className="text-muted-foreground text-xs">
                  {rec.company_name}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={marketBadgeVariant[rec.market] ?? "outline"}>
                {rec.market}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatPrice(rec.target_price)}
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatPrice(rec.stop_loss)}
            </TableCell>
            <TableCell className="text-right">
              {formatConfidence(rec.confidence_score)}
            </TableCell>
            <TableCell>
              {rec.strategy ? (
                <Badge variant="secondary">{rec.strategy}</Badge>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell className="max-w-[200px] truncate text-sm">
              {rec.reason}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {rec.expires_at ? formatDate(rec.expires_at) : "-"}
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {formatDate(rec.created_at)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
