import type { ReactNode } from "react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: string; positive: boolean };
  href?: string;
  description?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  href,
  description,
  className,
}: StatCardProps) {
  const content = (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        href && "cursor-pointer hover:-translate-y-0.5",
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-sm font-medium">
              {title}
            </p>
            <p className="mt-1 text-3xl font-bold tracking-tight">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {trend && (
              <p
                className={cn(
                  "mt-1 text-xs font-medium",
                  trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
                )}
              >
                {trend.positive ? "\u2191" : "\u2193"} {trend.value}
              </p>
            )}
            {description && (
              <p className="text-muted-foreground mt-1 text-xs">
                {description}
              </p>
            )}
          </div>
          <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
