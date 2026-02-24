import type { Metadata } from "next";

import { Book } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { GlossaryContent } from "./glossary-client";

export const metadata: Metadata = {
  title: "용어사전",
  description: "투자 초보자를 위한 거시경제·기술분석·지정학 용어 해설",
};

export default function GlossaryPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Book className="size-5" />}
        title="용어사전"
        description="투자 용어 학습"
      />
      <GlossaryContent />
    </div>
  );
}
