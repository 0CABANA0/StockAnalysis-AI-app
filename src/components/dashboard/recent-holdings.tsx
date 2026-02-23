import Link from "next/link";
import { ArrowRight, FolderOpen } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/portfolio/calculations";
import { cn } from "@/lib/utils";
import type { MarketType } from "@/types";
import type { HoldingStats, UnrealizedPnL } from "@/lib/portfolio/calculations";

export interface DashboardHolding {
  id: string;
  ticker: string;
  companyName: string;
  market: MarketType;
  stats: HoldingStats;
  pnl: UnrealizedPnL;
}

interface RecentHoldingsProps {
  holdings: DashboardHolding[];
}

const marketBadgeStyles: Record<MarketType, string> = {
  KOSPI: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  KOSDAQ:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  NYSE: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  NASDAQ:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

export function RecentHoldings({ holdings }: RecentHoldingsProps) {
  // 평가금액 기준 상위 5개
  const top5 = [...holdings]
    .filter((h) => h.stats.quantity > 0)
    .sort((a, b) => b.pnl.marketValue - a.pnl.marketValue)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>보유 종목</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/portfolio" className="gap-1">
              전체보기 <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {top5.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FolderOpen className="text-muted-foreground mb-3 size-10" />
            <p className="text-muted-foreground text-sm">
              포트폴리오에 종목을 추가하세요.
            </p>
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link href="/portfolio">포트폴리오로 이동</Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>종목</TableHead>
                <TableHead>시장</TableHead>
                <TableHead className="text-right">보유수량</TableHead>
                <TableHead className="text-right">현재가</TableHead>
                <TableHead className="text-right">손익률</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top5.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>
                    <Link href={`/trade/${h.id}`} className="hover:underline">
                      <div className="font-medium">{h.ticker}</div>
                      <div className="text-muted-foreground text-xs">
                        {h.companyName}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        marketBadgeStyles[h.market],
                      )}
                    >
                      {h.market}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {h.stats.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(h.pnl.currentPrice, h.market)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-medium",
                        h.pnl.unrealizedPnLPercent >= 0
                          ? "text-green-600"
                          : "text-red-600",
                      )}
                    >
                      {formatPercent(h.pnl.unrealizedPnLPercent)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
