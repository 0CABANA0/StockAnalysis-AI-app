"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { serverApiFetch } from "@/lib/api/client";
import type { PortfolioResponse, DeleteResponse } from "@/lib/api/portfolio";

export type ActionState = {
  error: string | null;
};

export async function addPortfolio(
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
  const companyName = (formData.get("companyName") as string)?.trim();
  const market = formData.get("market") as string;
  const sector = (formData.get("sector") as string)?.trim() || null;
  const memo = (formData.get("memo") as string)?.trim() || null;

  if (!ticker || !companyName || !market) {
    return { error: "티커, 종목명, 시장은 필수 입력입니다." };
  }

  try {
    await serverApiFetch<PortfolioResponse>("/portfolio/", session.access_token, {
      method: "POST",
      body: JSON.stringify({
        ticker,
        company_name: companyName,
        market,
        sector,
        memo,
      }),
    });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "종목 추가 실패",
    };
  }

  revalidatePath("/portfolio");
  return { error: null };
}

export async function deletePortfolio(
  portfolioId: string,
): Promise<ActionState> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { error: "로그인이 필요합니다." };
  }

  try {
    await serverApiFetch<DeleteResponse>(
      `/portfolio/${encodeURIComponent(portfolioId)}`,
      session.access_token,
      { method: "DELETE" },
    );
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "삭제 실패",
    };
  }

  revalidatePath("/portfolio");
  return { error: null };
}
