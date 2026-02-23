"use client";

import { useTransition } from "react";
import Link from "next/link";
import { MoreHorizontal, ArrowRightLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deletePortfolio } from "@/app/portfolio/actions";

interface PortfolioRowActionsProps {
  portfolioId: string;
  ticker: string;
}

export function PortfolioRowActions({
  portfolioId,
  ticker,
}: PortfolioRowActionsProps) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`${ticker} 종목을 삭제하시겠습니까?`)) return;

    startTransition(async () => {
      const result = await deletePortfolio(portfolioId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${ticker} 종목이 삭제되었습니다.`);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" disabled={isPending}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">메뉴 열기</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/trade/${portfolioId}`}>
            <ArrowRightLeft className="mr-2 size-4" />
            거래 입력
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 size-4" />
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
