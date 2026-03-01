"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  BellOff,
  Plus,
  Trash2,
  Target,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";

import {
  listAlerts,
  createAlert,
  deleteAlert,
  type PriceAlert,
} from "@/lib/api/alert";

// ─── 상수 ───

const ALERT_TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  TARGET_PRICE: {
    label: "목표가",
    icon: <Target className="size-3.5" />,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  },
  STOP_LOSS: {
    label: "손절가",
    icon: <ShieldAlert className="size-3.5" />,
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  },
};

// ─── 헬퍼 ───

function formatPrice(v: number): string {
  return v.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

// ─── 메인 컴포넌트 ───

export function AlertContent() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function fetchAlerts() {
    setLoading(true);
    setError(null);
    try {
      const list = await listAlerts();
      setAlerts(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알림 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function handleDelete(id: string) {
    try {
      await deleteAlert(id);
      setAlerts(alerts.filter((a) => a.id !== id));
    } catch {
      setError("삭제 실패");
    }
  }

  const activeAlerts = alerts.filter((a) => !a.is_triggered);
  const triggeredAlerts = alerts.filter((a) => a.is_triggered);

  return (
    <div className="space-y-4">
      {/* 추가 버튼 */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="mr-1 size-4" />
          알림 추가
        </Button>
      </div>

      {/* 추가 폼 */}
      {showForm && (
        <AddAlertForm
          onCreated={() => {
            setShowForm(false);
            fetchAlerts();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* 에러 */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 p-4">
            <AlertTriangle className="text-destructive size-5" />
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && alerts.length === 0 && !error && (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center">
            <Bell className="text-muted-foreground mb-3 size-12" />
            <p className="font-semibold">등록된 알림이 없습니다</p>
            <p className="text-muted-foreground mt-1 text-sm">
              목표가 또는 손절가를 설정하면
              <br />
              가격 도달 시 알림을 받을 수 있습니다.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 활성 알림 */}
      {activeAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4" />
              활성 알림 ({activeAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activeAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDelete={() => handleDelete(alert.id)}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* 발동된 알림 */}
      {triggeredAlerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground flex items-center gap-2 text-base">
              <BellOff className="size-4" />
              발동 완료 ({triggeredAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {triggeredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onDelete={() => handleDelete(alert.id)}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── 알림 카드 ───

function AlertCard({
  alert,
  onDelete,
}: {
  alert: PriceAlert;
  onDelete: () => void;
}) {
  const typeConfig =
    ALERT_TYPE_CONFIG[alert.alert_type] ?? ALERT_TYPE_CONFIG.TARGET_PRICE;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 ${
        alert.is_triggered ? "opacity-60" : ""
      }`}
    >
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{alert.ticker}</span>
          {alert.company_name && (
            <span className="text-muted-foreground text-xs">
              {alert.company_name}
            </span>
          )}
          <Badge className={`gap-1 ${typeConfig.color}`}>
            {typeConfig.icon}
            {typeConfig.label}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>
            설정가:{" "}
            <span className="font-medium">
              {formatPrice(alert.trigger_price)}
            </span>
          </span>
          {alert.current_price != null && (
            <span className="text-muted-foreground">
              현재가: {formatPrice(alert.current_price)}
            </span>
          )}
          {alert.is_triggered && alert.triggered_at && (
            <Badge variant="secondary" className="text-xs">
              {timeAgo(alert.triggered_at)} 발동
            </Badge>
          )}
        </div>
        {alert.memo && (
          <p className="text-muted-foreground text-xs">{alert.memo}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onDelete}
        className="text-muted-foreground hover:text-destructive p-1"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

// ─── 알림 추가 폼 ───

function AddAlertForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [alertType, setAlertType] = useState("TARGET_PRICE");
  const [triggerPrice, setTriggerPrice] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(triggerPrice);
    if (!ticker.trim() || !price) return;

    setSubmitting(true);
    setError(null);
    try {
      await createAlert({
        ticker: ticker.trim().toUpperCase(),
        company_name: companyName.trim() || undefined,
        alert_type: alertType,
        trigger_price: price,
        memo: memo.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록 실패");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">알림 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="종목코드 (예: AAPL)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              required
            />
            <Input
              placeholder="회사명 (선택)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={alertType === "TARGET_PRICE" ? "default" : "outline"}
              size="sm"
              onClick={() => setAlertType("TARGET_PRICE")}
            >
              <Target className="mr-1 size-3.5" />
              목표가
            </Button>
            <Button
              type="button"
              variant={alertType === "STOP_LOSS" ? "default" : "outline"}
              size="sm"
              onClick={() => setAlertType("STOP_LOSS")}
              className={
                alertType === "STOP_LOSS"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              <ShieldAlert className="mr-1 size-3.5" />
              손절가
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="알림 가격"
              value={triggerPrice}
              onChange={(e) => setTriggerPrice(e.target.value)}
              min="0"
              step="any"
              required
            />
            <Input
              placeholder="메모 (선택)"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              취소
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "등록 중..." : "등록"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
