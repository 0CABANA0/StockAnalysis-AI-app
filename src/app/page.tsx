import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold">StockAnalysis AI</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        AI 기반 주식 분석 대시보드
      </p>
      <div className="flex gap-4">
        <Link
          href="/auth/login"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
        >
          로그인
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-lg border border-gray-300 px-6 py-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
        >
          회원가입
        </Link>
      </div>
    </div>
  );
}
