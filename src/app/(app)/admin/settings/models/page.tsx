import type { Metadata } from "next";

import { Cpu } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ModelsContent } from "./models-client";

export const metadata: Metadata = {
  title: "AI 모델 설정",
};

export default function AdminModelsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Cpu className="size-5" />}
        title="AI 모델 관리"
        description="기능별 AI 모델 배정 및 파라미터"
      />
      <ModelsContent />
    </div>
  );
}
