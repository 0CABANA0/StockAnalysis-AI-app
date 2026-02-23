import { Wallet, TrendingUp, ArrowUpDown, PackageOpen } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKRW, formatPercent } from "@/lib/portfolio/calculations";
import { cn } from "@/lib/utils";

interface PortfolioOverviewProps {
  totalInvested: number;
  totalMarketValue: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  holdingCount: number;
}

export function PortfolioOverview({
  totalInvested,
  totalMarketValue,
  totalUnrealizedPnL,
  totalUnrealizedPnLPercent,
  holdingCount,
}: PortfolioOverviewProps) {
  const pnlPositive = totalUnrealizedPnL >= 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 투자금</CardTitle>
          <Wallet className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatKRW(totalInvested)}</div>
          <p className="text-muted-foreground text-xs">매수 원가 합계</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">평가 금액</CardTitle>
          <TrendingUp className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatKRW(totalMarketValue)}
          </div>
          <p className="text-muted-foreground text-xs">현재가 기준</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">미실현 손익</CardTitle>
          <ArrowUpDown className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold",
              pnlPositive ? "text-green-600" : "text-red-600",
            )}
          >
            {formatKRW(totalUnrealizedPnL)}
          </div>
          <p
            className={cn(
              "text-xs",
              pnlPositive ? "text-green-600" : "text-red-600",
            )}
          >
            {formatPercent(totalUnrealizedPnLPercent)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">보유 종목</CardTitle>
          <PackageOpen className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{holdingCount}개</div>
          <p className="text-muted-foreground text-xs">활성 포지션</p>
        </CardContent>
      </Card>
    </div>
  );
}
