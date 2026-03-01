"use client";

import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { getCalendarEvents } from "@/lib/api/calendar";
import type { EconomicCalendarEvent } from "@/types";

const importanceBadge: Record<string, string> = {
  HIGH: "bg-red-500/15 text-red-700 dark:text-red-400",
  MEDIUM: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  LOW: "bg-muted text-muted-foreground",
};

const typeLabel: Record<string, string> = {
  ECONOMIC: "경제",
  GEOPOLITICAL: "지정학",
  EARNINGS: "실적",
};

/** 티커 → 사용자 친화적 라벨 매핑 */
const assetLabel: Record<string, string> = {
  "^GSPC": "S&P 500",
  "^IXIC": "나스닥",
  "^TNX": "미 국채",
  "KRW=X": "원/달러",
  "^KS11": "코스피",
  "005930.KS": "삼성전자",
  "^DJI": "다우",
  "^VIX": "VIX",
  "CL=F": "유가",
  "GC=F": "금",
  "BTC-USD": "비트코인",
};

export function CalendarContent() {
  const [events, setEvents] = useState<EconomicCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    getCalendarEvents()
      .then((res) => setEvents(res.events))
      .catch(() => {
        setEvents([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [retryKey]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="경제 캘린더를 불러올 수 없습니다."
        onRetry={() => {
          setError(false);
          setLoading(true);
          setRetryKey((k) => k + 1);
        }}
      />
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground text-sm">
            등록된 이벤트가 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  // 날짜별 그룹핑
  const grouped: Record<string, EconomicCalendarEvent[]> = {};
  for (const ev of events) {
    const d = ev.event_date;
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(ev);
  }

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="space-y-4">
      {sortedDates.map((dateStr) => (
        <div key={dateStr}>
          <h3 className="mb-2 text-sm font-semibold">
            {new Date(dateStr + "T00:00:00").toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "short",
            })}
          </h3>
          <Card>
            <CardContent className="divide-y p-0">
              {grouped[dateStr].map((ev, i) => (
                <div key={i} className="flex flex-col gap-1.5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {typeLabel[ev.event_type] ?? ev.event_type}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {ev.event_title}
                      </p>
                      {ev.expected_impact && (
                        <p className="text-muted-foreground truncate text-xs">
                          {ev.expected_impact}
                        </p>
                      )}
                    </div>
                    {ev.country && (
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {ev.country}
                      </span>
                    )}
                    <Badge
                      className={
                        importanceBadge[ev.importance] ?? importanceBadge.LOW
                      }
                    >
                      {ev.importance}
                    </Badge>
                  </div>
                  {ev.affected_assets && ev.affected_assets.length > 0 && (
                    <div className="flex flex-wrap gap-1 pl-[calc(3rem+0.75rem)]">
                      <span className="text-muted-foreground text-[10px] leading-5">
                        영향 →
                      </span>
                      {ev.affected_assets.map((asset) => (
                        <Badge
                          key={asset}
                          variant="secondary"
                          className="px-1.5 py-0 text-[10px]"
                        >
                          {assetLabel[asset] ?? asset}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
