"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getSystemSettings, type SystemSettings } from "@/lib/api/admin";
import { Settings, Database, Clock, Gauge } from "lucide-react";

export function SettingsContent() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemSettings()
      .then((s) => setSettings(s))
      .catch(() => setSettings(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm">
            시스템 설정을 가져올 수 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const items = [
    {
      icon: Clock,
      title: "스케줄러",
      value: settings.scheduler_active ? "활성" : "비활성",
      active: settings.scheduler_active,
      description: "자동 데이터 수집 및 분석 스케줄러",
    },
    {
      icon: Database,
      title: "데이터 보존 기간",
      value: `${settings.data_retention_days}일`,
      active: true,
      description: "오래된 데이터 자동 정리 기준",
    },
    {
      icon: Settings,
      title: "관심종목 최대 수",
      value: `${settings.max_watchlist_items}개`,
      active: true,
      description: "사용자당 관심종목 등록 한도",
    },
    {
      icon: Gauge,
      title: "API 레이트 리밋",
      value: `${settings.api_rate_limit}회/분`,
      active: true,
      description: "사용자당 분당 API 호출 제한",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <item.icon className="size-4" />
              {item.title}
            </CardTitle>
            <Badge
              variant={item.active ? "default" : "secondary"}
              className="text-xs"
            >
              {item.active ? "활성" : "비활성"}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{item.value}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {item.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
