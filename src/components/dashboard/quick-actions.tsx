import Link from "next/link";
import { Plus, ArrowLeftRight, Bell, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ActionItem {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
}

const actions: ActionItem[] = [
  {
    label: "종목 추가",
    description: "포트폴리오에 새 종목 등록",
    href: "/portfolio",
    icon: Plus,
  },
  {
    label: "거래 입력",
    description: "매수/매도 거래 기록",
    href: "/portfolio",
    icon: ArrowLeftRight,
  },
  {
    label: "알림 설정",
    description: "가격/리스크 알림 관리",
    href: "#",
    icon: Bell,
    disabled: true,
  },
  {
    label: "AI 분석",
    description: "종목별 투자 리포트 생성",
    href: "#",
    icon: Sparkles,
    disabled: true,
  },
];

export function QuickActions() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map((action) => {
        const content = (
          <Card
            className={cn(
              "relative transition-colors",
              action.disabled
                ? "cursor-not-allowed opacity-60"
                : "hover:bg-muted/50 cursor-pointer",
            )}
          >
            {action.disabled && (
              <div className="absolute top-3 right-3">
                <Badge variant="secondary" className="text-[10px]">
                  준비 중
                </Badge>
              </div>
            )}
            <CardContent className="flex items-start gap-3 pt-0">
              <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-lg">
                <action.icon className="size-4" />
              </div>
              <div>
                <div className="text-sm font-medium">{action.label}</div>
                <div className="text-muted-foreground text-xs">
                  {action.description}
                </div>
              </div>
            </CardContent>
          </Card>
        );

        if (action.disabled) {
          return <div key={action.label}>{content}</div>;
        }

        return (
          <Link key={action.label} href={action.href}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
