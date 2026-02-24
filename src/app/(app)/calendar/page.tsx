import type { Metadata } from "next";

import { Calendar as CalendarIcon } from "lucide-react";
import { CalendarContent } from "./calendar-client";

export const metadata: Metadata = {
  title: "경제 캘린더",
  description: "FOMC, CPI, NFP 등 주요 경제 이벤트 일정",
};

export default function CalendarPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <CalendarIcon className="size-6" />
          경제 + 지정학 통합 캘린더
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          경제 이벤트, 정상회담, 무역 협상, 선거 일정 등
        </p>
      </div>

      <CalendarContent />
    </div>
  );
}
