"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { calculateSellTax } from "@/lib/portfolio/calculations";
import type { MarketType } from "@/types";

export type ActionState = {
  error: string | null;
};

export async function addTransaction(
  portfolioId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const type = formData.get("type") as "BUY" | "SELL";
  const quantity = Number(formData.get("quantity"));
  const price = Number(formData.get("price"));
  const tradeDate = formData.get("tradeDate") as string;
  const fee = Number(formData.get("fee") || 0);
  const memo = (formData.get("memo") as string)?.trim() || null;

  if (!type || !quantity || !price || !tradeDate) {
    return { error: "거래 유형, 수량, 가격, 거래일은 필수 입력입니다." };
  }

  if (quantity <= 0 || price <= 0) {
    return { error: "수량과 가격은 0보다 커야 합니다." };
  }

  // 포트폴리오 소유권 + 시장 정보 확인
  const { data: portfolio } = await supabase
    .from("portfolio")
    .select("id, market")
    .eq("id", portfolioId)
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .returns<{ id: string; market: string }[]>()
    .single();

  if (!portfolio) {
    return { error: "포트폴리오를 찾을 수 없습니다." };
  }

  // SELL 시 보유량 초과 검증
  if (type === "SELL") {
    const { data: transactions } = await supabase
      .from("transactions")
      .select("type, quantity")
      .eq("portfolio_id", portfolioId)
      .eq("user_id", user.id)
      .returns<{ type: string; quantity: number }[]>();

    const currentQty =
      transactions?.reduce((acc, tx) => {
        return tx.type === "BUY" ? acc + tx.quantity : acc - tx.quantity;
      }, 0) ?? 0;

    if (quantity > currentQty) {
      return {
        error: `보유 수량(${currentQty})을 초과하여 매도할 수 없습니다.`,
      };
    }
  }

  // 매도 세금 자동 계산
  const tax =
    type === "SELL"
      ? calculateSellTax(price, quantity, portfolio.market as MarketType)
      : 0;

  const { error } = await supabase.from("transactions").insert({
    portfolio_id: portfolioId,
    user_id: user.id,
    type,
    quantity,
    price,
    fee,
    tax,
    trade_date: tradeDate,
    memo,
  } as never);

  if (error) {
    return { error: `거래 등록 실패: ${error.message}` };
  }

  revalidatePath(`/trade/${portfolioId}`);
  revalidatePath("/portfolio");
  return { error: null };
}

export async function deleteTransaction(
  transactionId: string,
  portfolioId: string,
): Promise<ActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_id", user.id);

  if (error) {
    return { error: `삭제 실패: ${error.message}` };
  }

  revalidatePath(`/trade/${portfolioId}`);
  revalidatePath("/portfolio");
  return { error: null };
}

// ── 분배금 ──

export async function addDistribution(
  portfolioId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const amount = Number(formData.get("amount"));
  const distributionType = formData.get("distributionType") as string;
  const recordDate = formData.get("recordDate") as string;
  const paymentDate = (formData.get("paymentDate") as string)?.trim() || null;
  const memo = (formData.get("memo") as string)?.trim() || null;

  if (!amount || !distributionType || !recordDate) {
    return { error: "금액, 유형, 기준일은 필수 입력입니다." };
  }

  if (amount <= 0) {
    return { error: "금액은 0보다 커야 합니다." };
  }

  // 포트폴리오 소유권 확인
  const { data: portfolio } = await supabase
    .from("portfolio")
    .select("id")
    .eq("id", portfolioId)
    .eq("user_id", user.id)
    .eq("is_deleted", false)
    .returns<{ id: string }[]>()
    .single();

  if (!portfolio) {
    return { error: "포트폴리오를 찾을 수 없습니다." };
  }

  const { error } = await supabase.from("distributions").insert({
    portfolio_id: portfolioId,
    user_id: user.id,
    amount,
    distribution_type: distributionType,
    record_date: recordDate,
    payment_date: paymentDate,
    memo,
  } as never);

  if (error) {
    return { error: `분배금 등록 실패: ${error.message}` };
  }

  revalidatePath(`/trade/${portfolioId}`);
  revalidatePath("/portfolio");
  return { error: null };
}

export async function deleteDistribution(
  distributionId: string,
  portfolioId: string,
): Promise<ActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("distributions")
    .delete()
    .eq("id", distributionId)
    .eq("user_id", user.id);

  if (error) {
    return { error: `삭제 실패: ${error.message}` };
  }

  revalidatePath(`/trade/${portfolioId}`);
  revalidatePath("/portfolio");
  return { error: null };
}
