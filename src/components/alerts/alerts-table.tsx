"use client";

import { useTransition } from "react";
import { Bell, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PriceAlert } from "@/types";
import { deletePriceAlert } from "@/app/alerts/actions";

const ALERT_TYPE_LABELS: Record<
  string,
  {
    label: string;
    variant: "default" | "destructive" | "outline" | "secondary";
  }
> = {
  TARGET_PRICE: { label: "목표가", variant: "default" },
  STOP_LOSS: { label: "손절가", variant: "destructive" },
  DAILY_CHANGE: { label: "변동률", variant: "secondary" },
};

function formatTriggerValue(alertType: string, triggerPrice: number): string {
  if (alertType === "DAILY_CHANGE") {
    return `${triggerPrice}%`;
  }
  return triggerPrice.toLocaleString("ko-KR");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

interface AlertsTableProps {
  alerts: PriceAlert[];
}

export function AlertsTable({ alerts }: AlertsTableProps) {
  const [isPending, startTransition] = useTransition();

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <Bell className="text-muted-foreground size-8" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">설정된 알림이 없습니다</h3>
        <p className="text-muted-foreground text-sm">
          목표가, 손절가, 변동률 알림을 추가해보세요.
        </p>
      </div>
    );
  }

  function handleDelete(alertId: string) {
    if (!confirm("이 알림을 삭제하시겠습니까?")) return;

    startTransition(async () => {
      const result = await deletePriceAlert(alertId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("알림이 삭제되었습니다.");
      }
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>종목</TableHead>
          <TableHead>알림 유형</TableHead>
          <TableHead className="text-right">설정가</TableHead>
          <TableHead>상태</TableHead>
          <TableHead>생성일</TableHead>
          <TableHead>메모</TableHead>
          <TableHead className="w-[50px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {alerts.map((alert) => {
          const typeInfo = ALERT_TYPE_LABELS[alert.alert_type] ?? {
            label: alert.alert_type,
            variant: "outline" as const,
          };

          return (
            <TableRow key={alert.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{alert.ticker}</div>
                  {alert.company_name && (
                    <div className="text-muted-foreground text-xs">
                      {alert.company_name}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={typeInfo.variant}>{typeInfo.label}</Badge>
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatTriggerValue(alert.alert_type, alert.trigger_price)}
              </TableCell>
              <TableCell>
                {alert.is_triggered ? (
                  <div>
                    <Badge variant="destructive">발동됨</Badge>
                    {alert.triggered_at && (
                      <div className="text-muted-foreground mt-1 text-xs">
                        {formatDate(alert.triggered_at)}
                      </div>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline">대기중</Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(alert.created_at)}
              </TableCell>
              <TableCell className="text-muted-foreground max-w-[150px] truncate text-sm">
                {alert.memo ?? "-"}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={isPending}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleDelete(alert.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 size-4" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
