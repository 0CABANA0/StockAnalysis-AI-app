"use server";

import { revalidatePath } from "next/cache";

import { serverApiFetch } from "@/lib/api/client";
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
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { error: "로그인이 필요합니다." };
  }

  const ticker = (formData.get("ticker") as string)?.trim();
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

  try {
    await serverApiFetch("/alert/", session.access_token, {
      method: "POST",
      body: JSON.stringify({
        ticker,
        company_name: companyName,
        alert_type: alertType,
        trigger_price: triggerPrice,
        memo,
      }),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "알림 추가 실패";
    return { error: message };
  }

  revalidatePath("/alerts");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deletePriceAlert(alertId: string): Promise<ActionState> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { error: "로그인이 필요합니다." };
  }

  try {
    await serverApiFetch(
      `/alert/${encodeURIComponent(alertId)}`,
      session.access_token,
      { method: "DELETE" },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "삭제 실패";
    return { error: message };
  }

  revalidatePath("/alerts");
  revalidatePath("/dashboard");
  return { error: null };
}
