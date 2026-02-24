import type { Metadata } from "next";

import { Shield } from "lucide-react";
import { AdminDashboardContent } from "./admin-client";

export const metadata: Metadata = {
  title: "관리자",
};

export default function AdminPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Shield className="size-6" />
        관리자 대시보드
      </h1>
      <AdminDashboardContent />
    </div>
  );
}
