import { Users, UserCheck, UserX } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { MembersTable } from "@/components/admin/members-table";
import type { UserProfile } from "@/types";

export const metadata = {
  title: "회원 관리 | StockAnalysis AI",
};

export default async function AdminMembersPage() {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<UserProfile[]>();

  const allMembers = members ?? [];
  const activeCount = allMembers.filter((m) => m.status === "ACTIVE").length;
  const suspendedCount = allMembers.filter(
    (m) => m.status === "SUSPENDED",
  ).length;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">회원 관리</h1>
          <p className="text-muted-foreground text-sm">
            사용자 목록 및 역할 관리
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 회원</CardTitle>
              <Users className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allMembers.length}명</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 회원</CardTitle>
              <UserCheck className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCount}명</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">정지 회원</CardTitle>
              <UserX className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{suspendedCount}명</div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border">
          <MembersTable members={allMembers} />
        </div>
      </main>
    </div>
  );
}
