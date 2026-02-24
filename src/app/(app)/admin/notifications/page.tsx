import type { Metadata } from "next";

import { Bell } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationsContent } from "./notifications-client";

export const metadata: Metadata = {
  title: "알림 관리",
};

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Bell className="size-5" />}
        title="알림 발송"
        description="텔레그램 알림 발송 및 관리"
      />
      <NotificationsContent />
    </div>
  );
}
