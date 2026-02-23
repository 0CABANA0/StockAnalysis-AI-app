"use client";

import { useActionState, useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addTransaction, type ActionState } from "@/app/trade/[id]/actions";

const initialState: ActionState = { error: null };

interface TradeFormProps {
  portfolioId: string;
  ticker: string;
}

export function TradeForm({ portfolioId, ticker }: TradeFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const boundAction = addTransaction.bind(null, portfolioId);

  const [, formAction, isPending] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await boundAction(prevState, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("거래가 등록되었습니다.");
        formRef.current?.reset();
      }
      return result;
    },
    initialState,
  );

  const today = new Date().toISOString().split("T")[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>거래 입력 — {ticker}</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>거래 유형 *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="BUY"
                  defaultChecked
                  className="accent-primary"
                />
                <span className="text-sm font-medium text-blue-600">매수</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="type"
                  value="SELL"
                  className="accent-primary"
                />
                <span className="text-sm font-medium text-red-600">매도</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">수량 *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                step="1"
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">가격 *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tradeDate">거래일 *</Label>
              <Input
                id="tradeDate"
                name="tradeDate"
                type="date"
                defaultValue={today}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee">수수료</Label>
              <Input
                id="fee"
                name="fee"
                type="number"
                min="0"
                step="any"
                placeholder="0"
                defaultValue="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="memo">메모</Label>
            <Input id="memo" name="memo" placeholder="메모 (선택)" />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "등록 중..." : "거래 등록"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
