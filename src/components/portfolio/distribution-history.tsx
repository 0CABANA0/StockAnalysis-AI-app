"use client";

import { useTransition } from "react";
import { Banknote, Trash2 } from "lucide-react";
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
import { deleteDistribution } from "@/app/trade/[id]/actions";
import { AddDistributionDialog } from "@/components/portfolio/add-distribution-dialog";
import type { Distribution, DistributionType, MarketType } from "@/types";

const TYPE_LABELS: Record<DistributionType, string> = {
  DIVIDEND: "배당금",
  DISTRIBUTION: "분배금",
  INTEREST: "이자",
};

const TYPE_VARIANTS: Record<
  DistributionType,
  "default" | "secondary" | "outline"
> = {
  DIVIDEND: "default",
  DISTRIBUTION: "secondary",
  INTEREST: "outline",
};

interface DistributionHistoryProps {
  distributions: Distribution[];
  portfolioId: string;
  market: MarketType;
}

export function DistributionHistory({
  distributions,
  portfolioId,
  market,
}: DistributionHistoryProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(distId: string) {
    if (!confirm("이 분배금 기록을 삭제하시겠습니까?")) return;

    startTransition(async () => {
      const result = await deleteDistribution(distId, portfolioId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("분배금이 삭제되었습니다.");
      }
    });
  }

  const sorted = [...distributions].sort(
    (a, b) =>
      new Date(b.record_date).getTime() - new Date(a.record_date).getTime(),
  );

  const totalAmount = distributions.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>분배금 이력</CardTitle>
          {distributions.length > 0 && (
            <p className="text-muted-foreground mt-1 text-sm">
              총 수령액: {formatCurrency(totalAmount, market)}
            </p>
          )}
        </div>
        <AddDistributionDialog portfolioId={portfolioId} />
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Banknote className="text-muted-foreground mb-3 size-10" />
            <p className="text-muted-foreground text-sm">
              분배금 이력이 없습니다.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>유형</TableHead>
                <TableHead>기준일</TableHead>
                <TableHead>지급일</TableHead>
                <TableHead className="text-right">금액</TableHead>
                <TableHead>메모</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((dist) => (
                <TableRow key={dist.id}>
                  <TableCell>
                    <Badge variant={TYPE_VARIANTS[dist.distribution_type]}>
                      {TYPE_LABELS[dist.distribution_type]}
                    </Badge>
                  </TableCell>
                  <TableCell>{dist.record_date}</TableCell>
                  <TableCell>
                    {dist.payment_date ? (
                      dist.payment_date
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(dist.amount, market)}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate">
                    {dist.memo ? (
                      dist.memo
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(dist.id)}
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
