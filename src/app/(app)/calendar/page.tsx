import type { Metadata } from "next";

import { Calendar } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CalendarContent } from "./calendar-client";

export const metadata: Metadata = {
  title: "경제 캘린더",
  description: "FOMC, CPI, NFP 등 주요 경제 이벤트 일정",
};

export default function CalendarPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        icon={<Calendar className="size-5" />}
        title="경제 캘린더"
        description="주요 경제/지정학 일정"
      />
      <CalendarContent />
    </div>
  );
}
