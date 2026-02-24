import type { Metadata } from "next";

import { Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationHistoryContent } from "./history-client";

export const metadata: Metadata = {
  title: "알림 이력",
};

export default function AdminNotificationHistoryPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Clock className="size-5" />}
        title="알림 발송 기록"
        description="발송 이력 및 성공/실패 현황"
      />
      <NotificationHistoryContent />
    </div>
  );
}
