import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const roleBadgeStyles: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  ADMIN:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  USER: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "슈퍼 관리자",
  ADMIN: "관리자",
  USER: "일반 사용자",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .returns<{ display_name: string | null; role: string }[]>()
    .single();

  const displayName = profile?.display_name || user.email;
  const role = profile?.role || "USER";

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">대시보드</h1>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeStyles[role] || roleBadgeStyles.USER}`}
          >
            {roleLabels[role] || role}
          </span>
        </div>
        <p className="text-muted-foreground mt-1">
          안녕하세요, {displayName}님. 주식 분석 개요를 확인하세요.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-500">총 포트폴리오</h3>
          <p className="mt-2 text-3xl font-bold">&yen;0</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-500">일일 수익률</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">+0.00%</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-500">보유 종목</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-500">AI 분석</h3>
          <p className="mt-2 text-3xl font-bold">0건</p>
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-gray-200 p-8 dark:border-gray-800">
        <h2 className="mb-4 text-xl font-semibold">포트폴리오 추이</h2>
        <div className="flex h-64 items-center justify-center text-gray-400">
          차트가 여기에 표시됩니다
        </div>
      </div>

      <p className="text-muted-foreground mt-8 text-center text-xs">
        본 서비스는 투자 참고용이며, 투자 판단에 따른 책임은 본인에게 있습니다.
      </p>
    </div>
  );
}
