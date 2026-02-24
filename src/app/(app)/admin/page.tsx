import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "관리자 | Stock Intelligence",
};

export default function AdminPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Shield className="size-6" />
        관리자 대시보드
      </h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">총 사용자</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">—</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">오늘 활성</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">—</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">백엔드 상태</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">—</p></CardContent>
        </Card>
      </div>
    </div>
  );
}
