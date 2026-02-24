import type { Metadata } from "next";

import { Shield } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AdminDashboardContent } from "./admin-client";

export const metadata: Metadata = {
  title: "관리자",
};

export default function AdminPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Shield className="size-5" />}
        title="관리자 대시보드"
        description="시스템 상태 및 통계 요약"
      />
      <AdminDashboardContent />
    </div>
  );
}
