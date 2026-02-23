"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type ActionState = {
  error: string | null;
};

export async function addPortfolio(
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
  const companyName = (formData.get("companyName") as string)?.trim();
  const market = formData.get("market") as string;
  const sector = (formData.get("sector") as string)?.trim() || null;
  const memo = (formData.get("memo") as string)?.trim() || null;

  if (!ticker || !companyName || !market) {
    return { error: "티커, 종목명, 시장은 필수 입력입니다." };
  }

  // 중복 체크 (삭제되지 않은 종목)
  const { data: existing } = await supabase
    .from("portfolio")
    .select("id")
    .eq("user_id", user.id)
    .eq("ticker", ticker)
    .eq("is_deleted", false)
    .returns<{ id: string }[]>()
    .single();

  if (existing) {
    return { error: `이미 등록된 종목입니다: ${ticker}` };
  }

  const { error } = await supabase.from("portfolio").insert({
    user_id: user.id,
    ticker,
    company_name: companyName,
    market,
    sector,
    memo,
  } as never);

  if (error) {
    return { error: `종목 추가 실패: ${error.message}` };
  }

  revalidatePath("/portfolio");
  return { error: null };
}

export async function deletePortfolio(
  portfolioId: string,
): Promise<ActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 필요합니다." };
  }

  // soft delete
  const { error } = await supabase
    .from("portfolio")
    .update({ is_deleted: true } as never)
    .eq("id", portfolioId)
    .eq("user_id", user.id);

  if (error) {
    return { error: `삭제 실패: ${error.message}` };
  }

  revalidatePath("/portfolio");
  return { error: null };
}
