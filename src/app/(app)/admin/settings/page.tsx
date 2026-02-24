import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "시스템 설정 | Stock Intelligence",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">시스템 설정</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm">백엔드 연동 후 시스템 설정이 활성화됩니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}
