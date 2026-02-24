import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "알림 이력 | Stock Intelligence",
};

export default function AdminNotificationHistoryPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-bold">알림 발송 이력</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm">백엔드 연동 후 알림 이력이 표시됩니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}
