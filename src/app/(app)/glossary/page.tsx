import type { Metadata } from "next";

import { BookOpen } from "lucide-react";
import { GlossaryContent } from "./glossary-client";

export const metadata: Metadata = {
  title: "용어사전",
  description: "투자 초보자를 위한 거시경제·기술분석·지정학 용어 해설",
};

export default function GlossaryPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BookOpen className="size-6" />
          초보자 용어사전
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          투자에 필요한 핵심 용어를 쉽게 설명합니다
        </p>
      </div>

      <GlossaryContent />
    </div>
  );
}
