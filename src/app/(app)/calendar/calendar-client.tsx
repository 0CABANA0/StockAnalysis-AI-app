"use client";

import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { getCalendarEvents } from "@/lib/api/calendar";
import type { EconomicCalendarEvent } from "@/types";

const importanceBadge: Record<string, string> = {
  HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  MEDIUM:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  LOW: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

const typeLabel: Record<string, string> = {
  ECONOMIC: "경제",
  GEOPOLITICAL: "지정학",
  EARNINGS: "실적",
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
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Badge
                    variant="outline"
                    className="shrink-0 text-xs"
                  >
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
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
