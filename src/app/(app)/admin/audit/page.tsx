import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "감사 로그 | Stock Intelligence",
};

export default function AdminAuditPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">감사 로그</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm">백엔드 연동 후 감사 로그가 표시됩니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}
