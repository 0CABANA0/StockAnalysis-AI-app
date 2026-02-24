import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "경제 캘린더 | Stock Intelligence",
};

export default function CalendarPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon className="size-6" />
          경제 + 지정학 통합 캘린더
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          경제 이벤트, 정상회담, 무역 협상, 선거 일정 등
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-sm text-center">
            백엔드 연동 후 이벤트 캘린더가 표시됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
