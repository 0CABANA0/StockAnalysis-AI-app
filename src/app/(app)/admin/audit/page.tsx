import type { Metadata } from "next";

import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AuditContent } from "./audit-client";

export const metadata: Metadata = {
  title: "감사 로그",
};

export default function AdminAuditPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<FileText className="size-5" />}
        title="감사 로그"
        description="시스템 활동 이력 조회"
      />
      <AuditContent />
    </div>
  );
}
