"use client";

import { useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PortfolioRowActions } from "./portfolio-row-actions";
import {
  formatCurrency,
  formatPercent,
  type HoldingStats,
  type UnrealizedPnL,
} from "@/lib/portfolio/calculations";
import type { AccountType, MarketType } from "@/types";

const ACCOUNT_LABEL: Record<AccountType, string> = {
  GENERAL: "일반",
  ISA: "ISA",
  PENSION: "연금저축",
};

export interface HoldingRow {
  id: string;
  ticker: string;
  companyName: string;
  market: MarketType;
  accountType: AccountType;
  sector: string | null;
  stats: HoldingStats;
  pnl: UnrealizedPnL;
}

type SortKey = "ticker" | "marketValue" | "pnlPercent";
type SortDir = "asc" | "desc";

interface HoldingsTableProps {
  holdings: HoldingRow[];
}

export function HoldingsTable({ holdings }: HoldingsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("ticker");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = [...holdings].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortKey) {
      case "ticker":
        return a.ticker.localeCompare(b.ticker) * dir;
      case "marketValue":
        return (a.pnl.marketValue - b.pnl.marketValue) * dir;
      case "pnlPercent":
        return (a.pnl.unrealizedPnLPercent - b.pnl.unrealizedPnLPercent) * dir;
      default:
        return 0;
    }
  });

  const sortIndicator = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  if (holdings.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium">보유 종목이 없습니다</p>
        <p className="mt-1 text-sm">
          &quot;종목 추가&quot; 버튼을 눌러 시작하세요.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead
            className="cursor-pointer select-none"
            onClick={() => handleSort("ticker")}
          >
            종목{sortIndicator("ticker")}
          </TableHead>
          <TableHead>시장</TableHead>
          <TableHead>계좌</TableHead>
          <TableHead className="text-right">평균 매수가</TableHead>
          <TableHead className="text-right">보유 수량</TableHead>
          <TableHead className="text-right">현재가</TableHead>
          <TableHead
            className="cursor-pointer text-right select-none"
            onClick={() => handleSort("marketValue")}
          >
            평가 금액{sortIndicator("marketValue")}
          </TableHead>
          <TableHead
            className="cursor-pointer text-right select-none"
            onClick={() => handleSort("pnlPercent")}
          >
            손익률{sortIndicator("pnlPercent")}
          </TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((h) => (
          <TableRow key={h.id}>
            <TableCell>
              <Link href={`/trade/${h.id}`} className="hover:underline">
                <span className="font-medium">{h.ticker}</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  {h.companyName}
                </span>
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{h.market}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{ACCOUNT_LABEL[h.accountType]}</Badge>
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(h.stats.avgPrice, h.market)}
            </TableCell>
            <TableCell className="text-right">
              {h.stats.quantity.toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(h.pnl.currentPrice, h.market)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(h.pnl.marketValue, h.market)}
            </TableCell>
            <TableCell
              className={`text-right font-medium ${
                h.pnl.unrealizedPnLPercent >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {formatPercent(h.pnl.unrealizedPnLPercent)}
            </TableCell>
            <TableCell>
              <PortfolioRowActions portfolioId={h.id} ticker={h.ticker} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
