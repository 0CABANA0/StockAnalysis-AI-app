import { Banknote, BarChart3, TrendingUp, Briefcase } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKRW, formatPercent } from "@/lib/portfolio/calculations";

interface PortfolioSummaryCardsProps {
  totalInvested: number;
  totalMarketValue: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  holdingCount: number;
}

export function PortfolioSummaryCards({
  totalInvested,
  totalMarketValue,
  totalUnrealizedPnL,
  totalUnrealizedPnLPercent,
  holdingCount,
}: PortfolioSummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 투자금</CardTitle>
          <Banknote className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatKRW(totalInvested)}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">평가 금액</CardTitle>
          <BarChart3 className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatKRW(totalMarketValue)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">미실현 손익</CardTitle>
          <TrendingUp className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              totalUnrealizedPnL >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatKRW(totalUnrealizedPnL)}
          </div>
          <p
            className={`text-xs ${
              totalUnrealizedPnLPercent >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatPercent(totalUnrealizedPnLPercent)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">보유 종목</CardTitle>
          <Briefcase className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{holdingCount}개</div>
        </CardContent>
      </Card>
    </div>
  );
}
