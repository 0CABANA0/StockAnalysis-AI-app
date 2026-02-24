import type { Metadata } from "next";

import { FileText } from "lucide-react";
import { AuditContent } from "./audit-client";

export const metadata: Metadata = {
  title: "감사 로그",
};

export default function AdminAuditPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <FileText className="size-6" />
        감사 로그
      </h1>
      <AuditContent />
    </div>
  );
}
