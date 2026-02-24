import type { Metadata } from "next";

import { Users } from "lucide-react";
import { MembersContent } from "./members-client";

export const metadata: Metadata = {
  title: "회원 관리",
};

export default function AdminMembersPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Users className="size-6" />
        회원 관리
      </h1>
      <MembersContent />
    </div>
  );
}
