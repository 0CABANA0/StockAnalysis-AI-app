import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
import { Sidebar } from "./sidebar";
import { MobileTabBar } from "./mobile-tab-bar";
import { MobileHeader } from "./mobile-header";
import { DisclaimerBanner } from "./disclaimer-banner";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // user_profiles에서 역할 조회
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, role")
    .eq("user_id", user.id)
    .returns<{ display_name: string | null; role: string }[]>()
    .single();

  const displayName = profile?.display_name || user.email || "";
  const role = profile?.role || "USER";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 데스크톱 사이드바 */}
      <Sidebar
        displayName={displayName}
        role={role}
        signOutAction={signOut}
      />

      {/* 메인 컨텐츠 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
          <div className="px-4 pb-4 md:px-6">
            <DisclaimerBanner />
          </div>
        </main>
        <MobileTabBar />
      </div>
    </div>
  );
}
