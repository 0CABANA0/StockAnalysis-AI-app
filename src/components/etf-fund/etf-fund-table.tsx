"use client";

import { Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EtfFundMaster } from "@/types";

const assetTypeBadge: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  DOMESTIC_ETF: { label: "국내 ETF", variant: "default" },
  FOREIGN_ETF: { label: "해외 ETF", variant: "secondary" },
  DOMESTIC_FUND: { label: "국내 펀드", variant: "outline" },
};

function formatNumber(value: number | null, suffix = ""): string {
  if (value === null) return "-";
  return `${value.toLocaleString("ko-KR", { maximumFractionDigits: 2 })}${suffix}`;
}

function formatAum(value: number | null): string {
  if (value === null) return "-";
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(1)}조`;
  }
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(0)}억`;
  }
  return value.toLocaleString("ko-KR");
}

interface EtfFundTableProps {
  items: EtfFundMaster[];
  emptyLabel: string;
  emptyDescription: string;
}

export function EtfFundTable({
  items,
  emptyLabel,
  emptyDescription,
}: EtfFundTableProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <Package className="text-muted-foreground size-8" />
        </div>
        <h3 className="mb-1 text-lg font-semibold">{emptyLabel}</h3>
        <p className="text-muted-foreground text-sm">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>티커</TableHead>
          <TableHead>이름</TableHead>
          <TableHead>유형</TableHead>
          <TableHead>카테고리</TableHead>
          <TableHead className="text-right">NAV</TableHead>
          <TableHead className="text-right">TER</TableHead>
          <TableHead className="text-right">AUM</TableHead>
          <TableHead>벤치마크</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const typeBadge =
            assetTypeBadge[item.asset_type] ?? assetTypeBadge.DOMESTIC_ETF;

          return (
            <TableRow key={item.id}>
              <TableCell className="font-mono font-medium">
                {item.ticker}
              </TableCell>
              <TableCell>
                <div className="max-w-[200px] truncate">{item.name}</div>
              </TableCell>
              <TableCell>
                <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {item.category ?? "-"}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatNumber(item.nav)}
              </TableCell>
              <TableCell className="text-right font-mono">
                {formatNumber(item.ter, "%")}
              </TableCell>
              <TableCell className="text-right">
                {formatAum(item.aum)}
              </TableCell>
              <TableCell className="text-muted-foreground max-w-[150px] truncate text-sm">
                {item.benchmark ?? "-"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
