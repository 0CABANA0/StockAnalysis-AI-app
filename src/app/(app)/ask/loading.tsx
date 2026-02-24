import { Skeleton } from "@/components/ui/skeleton";

export default function AskLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col p-4 md:p-6">
      <div className="mb-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
      </div>
      <Skeleton className="flex-1" />
      <Skeleton className="mt-4 h-12 w-full" />
    </div>
  );
}
