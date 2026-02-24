import { Header } from "@/components/layout/header";
import { MacroContent } from "@/components/macro/macro-content";
import { serverApiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/server";
import type { MacroSnapshot, SentimentResult } from "@/types";

export const metadata = {
  title: "거시경제 | StockAnalysis AI",
};

interface UserMeResponse {
  user_id: string;
  email: string;
  display_name: string | null;
  role: string;
}

interface SentimentApiResponse {
  results: SentimentResult[];
  total: number;
  limit: number;
  offset: number;
}

export default async function MacroPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let isAdmin = false;
  let macro: MacroSnapshot | null = null;
  let sentiments: SentimentResult[] = [];

  if (session?.access_token) {
    const [userResult, macroResult, sentimentResult] =
      await Promise.allSettled([
        serverApiFetch<UserMeResponse>("/user/me", session.access_token),
        serverApiFetch<MacroSnapshot>("/macro/latest", session.access_token),
        serverApiFetch<SentimentApiResponse>(
          "/sentiment/results?limit=20",
          session.access_token,
        ),
      ]);

    if (userResult.status === "fulfilled") {
      const role = userResult.value.role;
      isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";
    }

    if (macroResult.status === "fulfilled") {
      macro = macroResult.value;
    }

    if (sentimentResult.status === "fulfilled") {
      sentiments = sentimentResult.value.results;
    }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <MacroContent
        macro={macro}
        sentiments={sentiments}
        isAdmin={isAdmin}
      />
    </div>
  );
}
