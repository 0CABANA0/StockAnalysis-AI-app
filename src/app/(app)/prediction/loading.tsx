import { Skeleton } from "@/components/ui/skeleton";

export default function PredictionLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-2 h-4 w-60" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-48 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
