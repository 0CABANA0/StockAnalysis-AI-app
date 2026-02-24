import type { Metadata } from "next";

import { Settings } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsContent } from "./settings-client";

export const metadata: Metadata = {
  title: "시스템 설정",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Settings className="size-5" />}
        title="시스템 설정"
        description="스케줄러 및 시스템 파라미터 관리"
      />
      <SettingsContent />
    </div>
  );
}
