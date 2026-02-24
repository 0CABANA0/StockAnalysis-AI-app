import type { Metadata } from "next";

import { MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AskContent } from "./ask-client";

export const metadata: Metadata = {
  title: "AI Q&A",
  description: "투자 관련 질문에 AI가 거시·지정학 데이터 기반 답변",
};

export default function AskPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col p-4 md:p-6">
      <div className="mb-4">
        <PageHeader
          icon={<MessageSquare className="size-5" />}
          title="AI Q&A"
          description="투자 관련 AI 질문"
        />
      </div>
      <AskContent />
    </div>
  );
}
