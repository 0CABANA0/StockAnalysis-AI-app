import type { Metadata } from "next";

import { Bell } from "lucide-react";
import { NotificationsContent } from "./notifications-client";

export const metadata: Metadata = {
  title: "알림 관리",
};

export default function AdminNotificationsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Bell className="size-6" />
        알림 관리
      </h1>
      <NotificationsContent />
    </div>
  );
}
