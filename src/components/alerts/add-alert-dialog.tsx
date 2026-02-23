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
import { addPriceAlert, type ActionState } from "@/app/alerts/actions";

const initialState: ActionState = { error: null };

const TRIGGER_PRICE_LABELS: Record<string, string> = {
  TARGET_PRICE: "목표가",
  STOP_LOSS: "손절가",
  DAILY_CHANGE: "변동률 (%)",
};

export function AddAlertDialog() {
  const [open, setOpen] = useState(false);
  const [alertType, setAlertType] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(
    addPriceAlert,
    initialState,
  );

  useEffect(() => {
    if (state.error === null && !isPending && formRef.current) {
      if (formRef.current.dataset.submitted === "true") {
        toast.success("알림이 추가되었습니다.");
        setOpen(false);
        setAlertType("");
        formRef.current.reset();
        formRef.current.dataset.submitted = "";
      }
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state, isPending]);

  const triggerPriceLabel = TRIGGER_PRICE_LABELS[alertType] ?? "설정가";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" />
          알림 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>알림 추가</DialogTitle>
          <DialogDescription>
            목표가, 손절가, 변동률 알림을 설정합니다.
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
            <Label htmlFor="companyName">종목명</Label>
            <Input
              id="companyName"
              name="companyName"
              placeholder="예: 삼성전자, Apple Inc."
            />
          </div>
          <div className="space-y-2">
            <Label>알림 유형 *</Label>
            <Select
              name="alertType"
              value={alertType}
              onValueChange={setAlertType}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="알림 유형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TARGET_PRICE">목표가 도달</SelectItem>
                <SelectItem value="STOP_LOSS">손절가 도달</SelectItem>
                <SelectItem value="DAILY_CHANGE">일일 변동률</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="alertType" value={alertType} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="triggerPrice">{triggerPriceLabel} *</Label>
            <Input
              id="triggerPrice"
              name="triggerPrice"
              type="number"
              step="any"
              min="0"
              placeholder={alertType === "DAILY_CHANGE" ? "예: 5" : "예: 75000"}
              required
            />
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
