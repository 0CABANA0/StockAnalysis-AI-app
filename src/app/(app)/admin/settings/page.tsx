import type { Metadata } from "next";

import { Settings } from "lucide-react";
import { SettingsContent } from "./settings-client";

export const metadata: Metadata = {
  title: "시스템 설정",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Settings className="size-6" />
        시스템 설정
      </h1>
      <SettingsContent />
    </div>
  );
}
