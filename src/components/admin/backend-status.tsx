"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchHealth, type HealthResponse } from "@/lib/api/health";

interface BackendStatusProps {
  lastMacroAt: string | null;
  lastSentimentAt: string | null;
}

function formatTime(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR");
}

export function BackendStatus({
  lastMacroAt,
  lastSentimentAt,
}: BackendStatusProps) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function check() {
    setLoading(true);
    try {
      const res = await fetchHealth();
      setHealth(res);
    } catch {
      setHealth({ status: "offline", timestamp: "" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    check();
  }, []);

  const isOnline = health?.status === "ok" || health?.status === "online";

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">백엔드 상태</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={check}
          disabled={loading}
        >
          <RefreshCw
            className={`size-4 ${loading ? "animate-spin" : ""}`}
          />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4" />
          <span className="text-sm font-medium">FastAPI</span>
          <Badge variant={isOnline ? "default" : "destructive"}>
            {loading ? "확인 중..." : isOnline ? "온라인" : "오프라인"}
          </Badge>
        </div>

        <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="block font-medium">마지막 거시 수집</span>
            {formatTime(lastMacroAt)}
          </div>
          <div>
            <span className="block font-medium">마지막 감성 분석</span>
            {formatTime(lastSentimentAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
