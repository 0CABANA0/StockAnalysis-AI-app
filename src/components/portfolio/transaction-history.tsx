"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/portfolio/calculations";
import { deleteTransaction } from "@/app/trade/[id]/actions";
import type { MarketType, Transaction } from "@/types";

interface TransactionHistoryProps {
  transactions: Transaction[];
  portfolioId: string;
  market: MarketType;
}

export function TransactionHistory({
  transactions,
  portfolioId,
  market,
}: TransactionHistoryProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(txId: string) {
    if (!confirm("이 거래를 삭제하시겠습니까?")) return;

    startTransition(async () => {
      const result = await deleteTransaction(txId, portfolioId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("거래가 삭제되었습니다.");
      }
    });
  }

  const sorted = [...transactions].sort(
    (a, b) =>
      new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>거래 이력</CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            거래 이력이 없습니다.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>유형</TableHead>
                <TableHead>거래일</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead className="text-right">가격</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead className="text-right">수수료</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <Badge
                      variant={tx.type === "BUY" ? "default" : "destructive"}
                    >
                      {tx.type === "BUY" ? "매수" : "매도"}
                    </Badge>
                  </TableCell>
                  <TableCell>{tx.trade_date}</TableCell>
                  <TableCell className="text-right">
                    {tx.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(tx.price, market)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(tx.price * tx.quantity, market)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(tx.fee + tx.tax, market)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(tx.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">삭제</span>
                    </Button>
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
