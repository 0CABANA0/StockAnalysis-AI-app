"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ActionState = {
  error: string | null;
};

export async function addPriceAlert(
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

  const ticker = (formData.get("ticker") as string)?.trim().toUpperCase();
  const companyName = (formData.get("companyName") as string)?.trim() || null;
  const alertType = formData.get("alertType") as string;
  const triggerPriceRaw = formData.get("triggerPrice") as string;
  const memo = (formData.get("memo") as string)?.trim() || null;

  if (!ticker || !alertType || !triggerPriceRaw) {
    return { error: "티커, 알림 유형, 목표가/손절가는 필수 입력입니다." };
  }

  const triggerPrice = parseFloat(triggerPriceRaw);
  if (isNaN(triggerPrice) || triggerPrice <= 0) {
    return { error: "유효한 가격을 입력해주세요." };
  }

  const { error } = await supabase.from("price_alerts").insert({
    user_id: user.id,
    ticker,
    company_name: companyName,
    alert_type: alertType,
    trigger_price: triggerPrice,
    memo,
  } as never);

  if (error) {
    return { error: `알림 추가 실패: ${error.message}` };
  }

  revalidatePath("/alerts");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deletePriceAlert(alertId: string): Promise<ActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  const { error } = await supabase
    .from("price_alerts")
    .delete()
    .eq("id", alertId)
    .eq("user_id", user.id);

  if (error) {
    return { error: `삭제 실패: ${error.message}` };
  }

  revalidatePath("/alerts");
  revalidatePath("/dashboard");
  return { error: null };
}
