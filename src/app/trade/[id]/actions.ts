"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { serverApiFetch } from "@/lib/api/client";
import type {
  TransactionResponse,
  DistributionResponse,
  DeleteResponse,
} from "@/lib/api/portfolio";

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
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
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

  try {
    await serverApiFetch<TransactionResponse>(
      "/portfolio/transaction",
      session.access_token,
      {
        method: "POST",
        body: JSON.stringify({
          portfolio_id: portfolioId,
          type,
          quantity,
          price,
          fee,
          trade_date: tradeDate,
          memo,
        }),
      },
    );
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "거래 등록 실패",
    };
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
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { error: "로그인이 필요합니다." };
  }

  try {
    await serverApiFetch<DeleteResponse>(
      `/portfolio/transaction/${encodeURIComponent(transactionId)}`,
      session.access_token,
      { method: "DELETE" },
    );
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "삭제 실패",
    };
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
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
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

  try {
    await serverApiFetch<DistributionResponse>(
      "/portfolio/distribution",
      session.access_token,
      {
        method: "POST",
        body: JSON.stringify({
          portfolio_id: portfolioId,
          amount,
          distribution_type: distributionType,
          record_date: recordDate,
          payment_date: paymentDate,
          memo,
        }),
      },
    );
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "분배금 등록 실패",
    };
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
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { error: "로그인이 필요합니다." };
  }

  try {
    await serverApiFetch<DeleteResponse>(
      `/portfolio/distribution/${encodeURIComponent(distributionId)}`,
      session.access_token,
      { method: "DELETE" },
    );
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "삭제 실패",
    };
  }

  revalidatePath(`/trade/${portfolioId}`);
  revalidatePath("/portfolio");
  return { error: null };
}
