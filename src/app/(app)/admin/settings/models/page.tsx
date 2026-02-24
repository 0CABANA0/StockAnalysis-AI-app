import type { Metadata } from "next";

import { Bot } from "lucide-react";
import { ModelsContent } from "./models-client";

export const metadata: Metadata = {
  title: "AI 모델 설정",
};

export default function AdminModelsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Bot className="size-6" />
        AI 모델 설정
      </h1>
      <ModelsContent />
    </div>
  );
}
