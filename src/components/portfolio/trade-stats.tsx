import { Calculator, Package, Receipt } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrency,
  type HoldingStats,
} from "@/lib/portfolio/calculations";
import type { MarketType } from "@/types";

interface TradeStatsProps {
  stats: HoldingStats;
  market: MarketType;
}

export function TradeStats({ stats, market }: TradeStatsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">평균 매수가</CardTitle>
          <Calculator className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.avgPrice, market)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">보유 수량</CardTitle>
          <Package className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.quantity.toLocaleString()}주
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">총 수수료/세금</CardTitle>
          <Receipt className="text-muted-foreground size-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(stats.totalFees, market)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
