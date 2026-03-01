import type { Metadata } from "next";

import { Bell } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AlertContent } from "./alert-client";

export const metadata: Metadata = {
  title: "가격 알림",
  description: "목표가·손절가 도달 알림 설정",
};

export default function AlertPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Bell className="size-5" />}
        title="가격 알림"
        description="목표가 또는 손절가 도달 시 알림을 받습니다"
      />
      <AlertContent />
    </div>
  );
}
