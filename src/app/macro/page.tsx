import { Header } from "@/components/layout/header";
import { MacroContent } from "@/components/macro/macro-content";
import { createClient } from "@/lib/supabase/server";
import type { MacroSnapshot, SentimentResult } from "@/types";

export const metadata = {
  title: "거시경제 | StockAnalysis AI",
};

export default async function MacroPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [macroResult, sentimentResult, profileResult] = await Promise.all([
    supabase
      .from("macro_snapshots")
      .select("*")
      .order("collected_at", { ascending: false })
      .limit(1)
      .returns<MacroSnapshot[]>(),
    supabase
      .from("sentiment_results")
      .select("*")
      .order("analyzed_at", { ascending: false })
      .limit(20)
      .returns<SentimentResult[]>(),
    supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user!.id)
      .returns<{ role: string }[]>()
      .single(),
  ]);

  const role = profileResult.data?.role ?? "USER";
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  return (
    <div className="min-h-screen">
      <Header />
      <MacroContent
        macro={macroResult.data?.[0] ?? null}
        sentiments={sentimentResult.data ?? []}
        isAdmin={isAdmin}
      />
    </div>
  );
}
