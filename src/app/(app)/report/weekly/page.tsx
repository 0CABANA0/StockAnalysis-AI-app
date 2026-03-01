import type { Metadata } from "next";

import { FileText } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WeeklyReportList } from "./weekly-list-client";

export const metadata: Metadata = {
  title: "주간 리포트",
  description: "주간 거시경제+지정학 종합 리포트 목록",
};

export default function WeeklyReportsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<FileText className="size-5" />}
        title="주간 종합 리포트"
        description="매주 거시경제 + 지정학 동향을 종합한 투자 전략 리포트"
      />
      <WeeklyReportList />
    </div>
  );
}
