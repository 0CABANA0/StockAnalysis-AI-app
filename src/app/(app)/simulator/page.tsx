import type { Metadata } from "next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical } from "lucide-react";

export const metadata: Metadata = {
  title: "시나리오 시뮬레이션 | Stock Intelligence",
};

export default function SimulatorPage() {
  const scenarios = [
    { title: "금리 인상 시나리오", desc: "금리 0.25% 인상하면?" },
    { title: "환율 급등 시나리오", desc: "환율 1,500원이면?" },
    { title: "대만 군사 충돌", desc: "대만해협 군사 충돌 시?" },
    { title: "미중 관세 확대", desc: "미중 관세 50% 시?" },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FlaskConical className="size-6" />
          시나리오 시뮬레이션
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          거시경제 + 지정학 What-if 분석
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {scenarios.map((s) => (
          <Card key={s.title} className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <p className="font-semibold">{s.title}</p>
              <p className="text-muted-foreground text-sm mt-1">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
