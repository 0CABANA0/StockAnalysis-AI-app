import type { Metadata } from "next";

import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { MembersContent } from "./members-client";

export const metadata: Metadata = {
  title: "회원 관리",
};

export default function AdminMembersPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Users className="size-5" />}
        title="회원 관리"
        description="사용자 역할 및 상태 관리"
      />
      <MembersContent />
    </div>
  );
}
