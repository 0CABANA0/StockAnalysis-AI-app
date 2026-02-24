import type { Metadata } from "next";

import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Q&A | Stock Intelligence",
};

export default function AskPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="size-6" />
          AI 투자 Q&A
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          투자 관련 질문을 AI에게 물어보세요
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center p-12 text-center">
          <MessageCircle className="text-muted-foreground mb-3 size-12" />
          <p className="text-muted-foreground text-sm">
            AI 챗봇 기능은 백엔드 연동 후 활성화됩니다.
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            AI가 생성한 참고 정보입니다. 전문가 상담을 권장합니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
