import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  icon,
  title,
  description,
  badge,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold md:text-2xl">{title}</h1>
              {badge}
            </div>
            {description && (
              <p className="text-muted-foreground mt-0.5 text-sm">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
      <Separator />
    </div>
  );
}
