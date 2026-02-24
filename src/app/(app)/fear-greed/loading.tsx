import { Skeleton } from "@/components/ui/skeleton";

export default function FearGreedLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="space-y-4">
        <Skeleton className="mx-auto h-48 w-48 rounded-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
