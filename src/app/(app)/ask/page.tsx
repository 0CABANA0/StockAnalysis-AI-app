import type { Metadata } from "next";

import { MessageCircle } from "lucide-react";
import { AskContent } from "./ask-client";

export const metadata: Metadata = {
  title: "AI Q&A",
  description: "투자 관련 질문에 AI가 거시·지정학 데이터 기반 답변",
};

export default function AskPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col p-4 md:p-6">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <MessageCircle className="size-6" />
          AI 투자 Q&A
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          투자 관련 질문을 AI에게 물어보세요
        </p>
      </div>

      <AskContent />
    </div>
  );
}
