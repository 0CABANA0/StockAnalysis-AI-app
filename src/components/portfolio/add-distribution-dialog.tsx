"use client";

import { useActionState, useRef, useState } from "react";
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
import { addDistribution, type ActionState } from "@/app/trade/[id]/actions";

const initialState: ActionState = { error: null };

interface AddDistributionDialogProps {
  portfolioId: string;
}

export function AddDistributionDialog({
  portfolioId,
}: AddDistributionDialogProps) {
  const [open, setOpen] = useState(false);
  const [distType, setDistType] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const boundAction = addDistribution.bind(null, portfolioId);

  const [, formAction, isPending] = useActionState(
    async (prevState: ActionState, formData: FormData) => {
      const result = await boundAction(prevState, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("분배금이 등록되었습니다.");
        setOpen(false);
        setDistType("");
        formRef.current?.reset();
      }
      return result;
    },
    initialState,
  );

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 size-4" />
          분배금 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>분배금 등록</DialogTitle>
          <DialogDescription>
            배당금, 분배금, 이자 수익을 기록합니다.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>유형 *</Label>
            <Select
              name="distributionType"
              value={distType}
              onValueChange={setDistType}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="유형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIVIDEND">배당금</SelectItem>
                <SelectItem value="DISTRIBUTION">분배금</SelectItem>
                <SelectItem value="INTEREST">이자</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="distributionType" value={distType} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">금액 *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="any"
              placeholder="0"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recordDate">기준일 *</Label>
              <Input
                id="recordDate"
                name="recordDate"
                type="date"
                defaultValue={today}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">지급일</Label>
              <Input id="paymentDate" name="paymentDate" type="date" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="distMemo">메모</Label>
            <Input id="distMemo" name="memo" placeholder="메모 (선택)" />
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
              {isPending ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
