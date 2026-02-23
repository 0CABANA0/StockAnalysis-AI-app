import { DollarSign, Activity, Landmark, Fuel } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MacroSnapshot } from "@/types";

interface MacroOverviewProps {
  snapshot: MacroSnapshot | null;
}

export function MacroOverview({ snapshot }: MacroOverviewProps) {
  if (!snapshot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>거시 지표</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="text-muted-foreground mb-3 size-10" />
            <p className="text-muted-foreground text-sm">
              거시 지표가 아직 수집되지 않았습니다.
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              백엔드 스케줄러가 활성화되면 자동으로 업데이트됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const indicators = [
    {
      label: "USD/KRW",
      value: snapshot.usd_krw,
      format: (v: number) =>
        `${v.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}원`,
      icon: DollarSign,
    },
    {
      label: "VIX",
      value: snapshot.vix,
      format: (v: number) => v.toFixed(2),
      icon: Activity,
    },
    {
      label: "미국 10년물",
      value: snapshot.us_10y_yield,
      format: (v: number) => `${v.toFixed(3)}%`,
      icon: Landmark,
    },
    {
      label: "WTI 유가",
      value: snapshot.wti,
      format: (v: number) => `$${v.toFixed(2)}`,
      icon: Fuel,
    },
  ];

  const collectedAt = new Date(snapshot.collected_at).toLocaleDateString(
    "ko-KR",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>거시 지표</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {indicators.map((ind) => (
            <div key={ind.label} className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <ind.icon className="size-3.5" />
                {ind.label}
              </div>
              <div className="text-lg font-semibold">
                {ind.value != null ? ind.format(ind.value) : "-"}
              </div>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-4 text-xs">
          기준: {collectedAt}
        </p>
      </CardContent>
    </Card>
  );
}
