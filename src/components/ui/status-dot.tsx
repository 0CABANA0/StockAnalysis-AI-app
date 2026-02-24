import { cn } from "@/lib/utils";

type StatusType = "online" | "offline" | "warning";

interface StatusDotProps {
  status: StatusType;
  label?: string;
  className?: string;
}

const statusStyles: Record<StatusType, string> = {
  online: "bg-emerald-500",
  offline: "bg-red-500",
  warning: "bg-amber-500",
};

export function StatusDot({ status, label, className }: StatusDotProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex size-3">
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-75",
            statusStyles[status],
          )}
        />
        <span
          className={cn(
            "relative inline-flex size-3 rounded-full",
            statusStyles[status],
          )}
        />
      </span>
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
