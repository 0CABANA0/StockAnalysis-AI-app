"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addPortfolio, type ActionState } from "@/app/portfolio/actions";

const initialState: ActionState = { error: null };

export function AddPortfolioDialog() {
  const [open, setOpen] = useState(false);
  const [market, setMarket] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    addPortfolio,
    initialState,
  );

  useEffect(() => {
    if (state.error === null && !isPending && formRef.current) {
      // 성공 시 다이얼로그 닫기 (초기 상태 제외)
      if (formRef.current.dataset.submitted === "true") {
        toast.success("종목이 추가되었습니다.");
        setOpen(false);
        setMarket("");
        formRef.current.reset();
        formRef.current.dataset.submitted = "";
      }
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state, isPending]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          종목 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>종목 추가</DialogTitle>
          <DialogDescription>
            포트폴리오에 새로운 종목을 추가합니다.
          </DialogDescription>
        </DialogHeader>
        <form
          ref={formRef}
          action={formAction}
          onSubmit={() => {
            if (formRef.current) {
              formRef.current.dataset.submitted = "true";
            }
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="ticker">티커 *</Label>
            <Input
              id="ticker"
              name="ticker"
              placeholder="예: 005930, AAPL"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">종목명 *</Label>
            <Input
              id="companyName"
              name="companyName"
              placeholder="예: 삼성전자, Apple Inc."
              required
            />
          </div>
          <div className="space-y-2">
            <Label>시장 *</Label>
            <Select
              name="market"
              value={market}
              onValueChange={setMarket}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="시장 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KOSPI">KOSPI</SelectItem>
                <SelectItem value="KOSDAQ">KOSDAQ</SelectItem>
                <SelectItem value="NYSE">NYSE</SelectItem>
                <SelectItem value="NASDAQ">NASDAQ</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="market" value={market} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">섹터</Label>
            <Input id="sector" name="sector" placeholder="예: 반도체, 기술" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="memo">메모</Label>
            <Input id="memo" name="memo" placeholder="메모 (선택)" />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "추가 중..." : "추가"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
