"use client";

import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ImageAnalysisResponse } from "@/lib/api/image";

const STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  SUCCESS: { label: "검증 완료", variant: "default" },
  PARTIAL: { label: "일부 검증", variant: "secondary" },
  FAILED: { label: "검증 실패", variant: "destructive" },
};

const OPINION_MAP: Record<
  string,
  { label: string; color: string; Icon: typeof TrendingUp }
> = {
  STRONG_BUY: {
    label: "적극 매수",
    color: "text-red-600 dark:text-red-400",
    Icon: TrendingUp,
  },
  BUY: {
    label: "매수",
    color: "text-red-500 dark:text-red-400",
    Icon: TrendingUp,
  },
  HOLD: {
    label: "보유",
    color: "text-yellow-600 dark:text-yellow-400",
    Icon: Minus,
  },
  SELL: {
    label: "매도",
    color: "text-blue-500 dark:text-blue-400",
    Icon: TrendingDown,
  },
  STRONG_SELL: {
    label: "적극 매도",
    color: "text-blue-600 dark:text-blue-400",
    Icon: TrendingDown,
  },
};

const RISK_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  LOW: { label: "낮음", variant: "secondary" },
  MEDIUM: { label: "보통", variant: "default" },
  HIGH: { label: "높음", variant: "destructive" },
};

function formatNumber(n: number | null | undefined): string {
  if (n == null) return "-";
  return n.toLocaleString("ko-KR");
}

function formatPercent(n: number | null | undefined): string {
  if (n == null) return "-";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

interface AnalysisResultProps {
  result: ImageAnalysisResponse;
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  const { holdings, investment_guide, validation_status, processing_time_ms } =
    result;
  const status = STATUS_MAP[validation_status] ?? STATUS_MAP.FAILED;

  return (
    <div className="space-y-6">
      {/* 요약 헤더 */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant={status.variant}>{status.label}</Badge>
        <span className="text-muted-foreground text-sm">
          {holdings.length}개 종목 인식
        </span>
        <span className="text-muted-foreground flex items-center gap-1 text-sm">
          <Clock className="size-3.5" />
          {(processing_time_ms / 1000).toFixed(1)}초
        </span>
      </div>

      {/* 종목 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">인식된 종목</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>종목</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead className="text-right">평균가</TableHead>
                <TableHead className="text-right">현재가</TableHead>
                <TableHead className="text-right">수익률</TableHead>
                <TableHead className="text-center">검증</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((h, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{h.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {h.ticker ?? "-"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(h.quantity)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(h.avg_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(h.current_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    {h.profit_loss_rate != null ? (
                      <span
                        className={
                          h.profit_loss_rate >= 0
                            ? "text-red-500"
                            : "text-blue-500"
                        }
                      >
                        {formatPercent(h.profit_loss_rate)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {h.verified ? (
                      <CheckCircle2 className="mx-auto size-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="mx-auto size-4 text-yellow-500" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {holdings.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-muted-foreground py-8 text-center"
                  >
                    <XCircle className="mx-auto mb-2 size-8 opacity-40" />
                    종목을 인식하지 못했습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* AI 투자 가이드 */}
      {investment_guide && (
        <>
          {/* 진단 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">AI 포트폴리오 진단</CardTitle>
                {investment_guide.risk_level && (
                  <Badge
                    variant={
                      RISK_MAP[investment_guide.risk_level]?.variant ??
                      "secondary"
                    }
                  >
                    리스크:{" "}
                    {RISK_MAP[investment_guide.risk_level]?.label ??
                      investment_guide.risk_level}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                {investment_guide.diagnosis}
              </p>
            </CardContent>
          </Card>

          {/* 섹터 분석 */}
          {investment_guide.sector_analysis.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">섹터 분석</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>섹터</TableHead>
                      <TableHead className="text-right">비중</TableHead>
                      <TableHead>평가</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investment_guide.sector_analysis.map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="text-right">
                          {s.weight_pct.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {s.assessment}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* 종목별 의견 */}
          {investment_guide.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">종목별 투자 의견</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>종목</TableHead>
                      <TableHead>의견</TableHead>
                      <TableHead>근거</TableHead>
                      <TableHead className="text-right">목표가</TableHead>
                      <TableHead className="text-right">손절가</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investment_guide.recommendations.map((r, i) => {
                      const opinion = OPINION_MAP[r.opinion];
                      const OpinionIcon = opinion?.Icon ?? Minus;
                      return (
                        <TableRow key={i}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{r.name}</p>
                              <p className="text-muted-foreground text-xs">
                                {r.ticker ?? ""}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`flex items-center gap-1 text-sm font-medium ${opinion?.color ?? ""}`}
                            >
                              <OpinionIcon className="size-3.5" />
                              {opinion?.label ?? r.opinion}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-[200px] text-sm">
                            {r.rationale}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(r.target_price)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatNumber(r.stop_loss)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* 액션 플랜 */}
          {investment_guide.action_plan && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">액션 플랜</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <ActionPlanSection
                    title="이번 주"
                    items={investment_guide.action_plan.this_week}
                  />
                  <ActionPlanSection
                    title="이번 달"
                    items={investment_guide.action_plan.this_month}
                  />
                  <ActionPlanSection
                    title="3개월 내"
                    items={investment_guide.action_plan.three_months}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function ActionPlanSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">{title}</h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-muted-foreground text-sm">
            &bull; {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
