"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getGeoRiskDetail } from "@/lib/api/geo";
import type { GeopoliticalRisk, GeopoliticalEvent } from "@/types";
import { AlertTriangle, ExternalLink, ArrowUp, ArrowDown, Minus } from "lucide-react";

const levelColor: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  MODERATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const severityIcon: Record<string, React.ReactNode> = {
  UP: <ArrowUp className="size-4 text-red-500" />,
  DOWN: <ArrowDown className="size-4 text-green-500" />,
  STABLE: <Minus className="size-4 text-gray-500" />,
};

export function RiskDetailContent({ riskId }: { riskId: string }) {
  const [risk, setRisk] = useState<GeopoliticalRisk | null>(null);
  const [events, setEvents] = useState<GeopoliticalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGeoRiskDetail(riskId)
      .then((res) => {
        setRisk(res.risk);
        setEvents(res.events);
      })
      .catch(() => {
        setRisk(null);
        setEvents([]);
      })
      .finally(() => setLoading(false));
  }, [riskId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!risk) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center p-12 text-center">
          <AlertTriangle className="text-muted-foreground mb-3 size-12" />
          <p className="font-semibold">리스크 정보를 찾을 수 없습니다</p>
          <Link href="/geo" className="text-primary mt-2 text-sm hover:underline">
            리스크 목록으로 돌아가기
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 리스크 개요 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{risk.title}</CardTitle>
            <Badge className={levelColor[risk.risk_level] ?? ""}>
              {risk.risk_level}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {risk.description && (
            <p className="mb-4 text-sm leading-relaxed">{risk.description}</p>
          )}

          <div className="grid gap-3 md:grid-cols-3">
            {risk.affected_sectors.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  영향 섹터
                </p>
                <div className="flex flex-wrap gap-1">
                  {risk.affected_sectors.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {risk.affected_tickers.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  영향 종목
                </p>
                <div className="flex flex-wrap gap-1">
                  {risk.affected_tickers.map((t) => (
                    <Link key={t} href={`/guide/${t}`}>
                      <Badge variant="secondary" className="cursor-pointer text-xs">
                        {t}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {risk.affected_etfs.length > 0 && (
              <div>
                <p className="text-muted-foreground mb-1 text-xs font-medium">
                  관련 ETF
                </p>
                <div className="flex flex-wrap gap-1">
                  {risk.affected_etfs.map((e) => (
                    <Link key={e} href={`/etf/${e}`}>
                      <Badge variant="secondary" className="cursor-pointer text-xs">
                        {e}
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 이벤트 타임라인 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            관련 이벤트 ({events.length}건)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              아직 수집된 이벤트가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  {severityIcon[ev.severity_change ?? "STABLE"]}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {ev.event_title}
                      </span>
                    </div>
                    {ev.impact_assessment && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {ev.impact_assessment}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-2">
                      {ev.analyzed_at && (
                        <span className="text-muted-foreground text-xs">
                          {new Date(ev.analyzed_at).toLocaleDateString("ko-KR")}
                        </span>
                      )}
                      {ev.source_url && (
                        <a
                          href={ev.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
                        >
                          <ExternalLink className="size-3" />
                          원문
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
