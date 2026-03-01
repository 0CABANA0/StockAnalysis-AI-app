"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CausalChainStep } from "@/types";
import { ArrowDown, TrendingDown, TrendingUp, Minus } from "lucide-react";

const directionConfig: Record<
  string,
  { label: string; color: string; icon: typeof TrendingUp }
> = {
  POSITIVE: {
    label: "긍정",
    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    icon: TrendingUp,
  },
  NEGATIVE: {
    label: "부정",
    color: "bg-red-500/15 text-red-700 dark:text-red-400",
    icon: TrendingDown,
  },
  MIXED: {
    label: "혼합",
    color: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    icon: Minus,
  },
};

interface CausalChainProps {
  steps: CausalChainStep[];
  title?: string;
}

export function CausalChain({
  steps,
  title = "인과관계 분석",
}: CausalChainProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="mb-4 font-semibold">{title}</h3>

        <div className="space-y-1">
          {steps.map((step, i) => {
            const config = directionConfig[step.direction] ?? directionConfig.MIXED;
            const Icon = config.icon;

            return (
              <div key={i}>
                {/* 단계 카드 */}
                <div className="rounded-lg border p-3">
                  {/* 상단: 방향 뱃지 + 섹터 태그 */}
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge className={config.color}>
                      <Icon className="mr-1 size-3" />
                      {config.label}
                    </Badge>
                    {step.affected_sectors.map((sector) => (
                      <Badge
                        key={sector}
                        variant="outline"
                        className="text-xs"
                      >
                        {sector}
                      </Badge>
                    ))}
                  </div>

                  {/* 이벤트 → 영향 */}
                  <div className="mb-2">
                    <p className="text-sm font-medium">{step.event}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      → {step.impact}
                    </p>
                  </div>

                  {/* 근거 설명 (교육적 해설) */}
                  <div className="bg-muted/50 rounded-md p-2">
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      💡 {step.reasoning}
                    </p>
                  </div>
                </div>

                {/* 연결 화살표 (마지막 단계 제외) */}
                {i < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="text-muted-foreground size-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
