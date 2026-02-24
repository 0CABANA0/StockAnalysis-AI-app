import type { Metadata } from "next";

import { Clock } from "lucide-react";
import { NotificationHistoryContent } from "./history-client";

export const metadata: Metadata = {
  title: "알림 이력",
};

export default function AdminNotificationHistoryPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Clock className="size-6" />
        알림 발송 이력
      </h1>
      <NotificationHistoryContent />
    </div>
  );
}
