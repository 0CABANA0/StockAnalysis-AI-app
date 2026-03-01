"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getSystemSettings, type SystemSettings } from "@/lib/api/admin";
import {
  checkPriceAlerts,
  checkRiskAlerts,
  type AlertCheckResult,
  type RiskAlertResult,
} from "@/lib/api/alert";
import { syncEtfData, type EtfSyncResult } from "@/lib/api/etf";
import {
  collectFearGreed,
  type FearGreedCollectResult,
} from "@/lib/api/fear-greed";
import {
  Settings,
  Database,
  Clock,
  Gauge,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Bell,
  ShieldAlert,
  LineChart,
  Activity,
} from "lucide-react";

// ─── 시스템 설정 표시 ───

function SystemSettingsSection({
  settings,
}: {
  settings: SystemSettings | null;
}) {
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

// ─── 데이터 관리 (수동 트리거) ───

type JobStatus = "idle" | "running" | "success" | "error";

interface JobState {
  status: JobStatus;
  result?: string;
  error?: string;
}

interface DataJob {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => Promise<string>;
}

function formatResult(
  key: string,
  data: unknown,
): string {
  switch (key) {
    case "price-alert": {
      const r = data as AlertCheckResult;
      return `체크 ${r.checked_count}건, 발동 ${r.triggered_count}건, 알림 ${r.notified_count}건${r.failed_tickers.length > 0 ? ` (실패: ${r.failed_tickers.join(", ")})` : ""}`;
    }
    case "risk-alert": {
      const r = data as RiskAlertResult;
      const alerts: string[] = [];
      if (r.vix_alert) alerts.push(`VIX ${r.vix_value}`);
      if (r.geopolitical_alert)
        alerts.push(`지정학 긴급 ${r.high_urgency_count}건`);
      if (r.currency_alert)
        alerts.push(`환율 ${r.usd_krw_change_pct?.toFixed(2)}%`);
      return alerts.length > 0
        ? `경고: ${alerts.join(", ")} / 알림 ${r.notifications_sent}건`
        : `이상 없음 / 알림 ${r.notifications_sent}건`;
    }
    case "etf-sync": {
      const r = data as EtfSyncResult;
      return `국내 ${r.domestic_count} + 해외 ${r.foreign_count} + 펀드 ${r.fund_count} = 총 ${r.total_count}건${r.failed_tickers.length > 0 ? ` (실패: ${r.failed_tickers.join(", ")})` : ""}`;
    }
    case "fear-greed": {
      const r = data as FearGreedCollectResult;
      return `${r.label} (${r.value})`;
    }
    default:
      return JSON.stringify(data);
  }
}

function DataManagementSection() {
  const [jobs, setJobs] = useState<Record<string, JobState>>({});

  const dataJobs: DataJob[] = [
    {
      key: "price-alert",
      label: "가격 알림 확인",
      description: "등록된 가격 알림의 도달 여부를 수동 확인합니다",
      icon: Bell,
      action: async () => {
        const r = await checkPriceAlerts();
        return formatResult("price-alert", r);
      },
    },
    {
      key: "risk-alert",
      label: "리스크 알림 확인",
      description: "VIX, 환율, 지정학 리스크를 수동 확인합니다",
      icon: ShieldAlert,
      action: async () => {
        const r = await checkRiskAlerts();
        return formatResult("risk-alert", r);
      },
    },
    {
      key: "etf-sync",
      label: "ETF 데이터 동기화",
      description: "ETF/펀드 마스터 데이터를 최신 상태로 갱신합니다",
      icon: LineChart,
      action: async () => {
        const r = await syncEtfData();
        return formatResult("etf-sync", r);
      },
    },
    {
      key: "fear-greed",
      label: "공포/탐욕 지수 수집",
      description: "CNN 공포/탐욕 지수를 수동 수집합니다",
      icon: Activity,
      action: async () => {
        const r = await collectFearGreed();
        return formatResult("fear-greed", r);
      },
    },
  ];

  async function runJob(job: DataJob) {
    setJobs((prev) => ({
      ...prev,
      [job.key]: { status: "running" },
    }));
    try {
      const result = await job.action();
      setJobs((prev) => ({
        ...prev,
        [job.key]: { status: "success", result },
      }));
    } catch (err) {
      setJobs((prev) => ({
        ...prev,
        [job.key]: {
          status: "error",
          error: err instanceof Error ? err.message : "실행 실패",
        },
      }));
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="size-4" />
          데이터 관리
        </CardTitle>
        <p className="text-muted-foreground text-xs">
          스케줄러 외 수동으로 데이터를 수집/확인합니다
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {dataJobs.map((job) => {
          const state = jobs[job.key] ?? { status: "idle" as JobStatus };
          return (
            <div
              key={job.key}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <div className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                <job.icon className="size-4" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{job.label}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={state.status === "running"}
                    onClick={() => runJob(job)}
                    className="h-7 gap-1 text-xs"
                  >
                    {state.status === "running" ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Play className="size-3" />
                    )}
                    {state.status === "running" ? "실행 중..." : "실행"}
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  {job.description}
                </p>
                {state.status === "success" && state.result && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    <span>{state.result}</span>
                  </div>
                )}
                {state.status === "error" && state.error && (
                  <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                    <XCircle className="size-3.5 shrink-0" />
                    <span>{state.error}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── 메인 컴포넌트 ───

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
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SystemSettingsSection settings={settings} />
      <DataManagementSection />
    </div>
  );
}
