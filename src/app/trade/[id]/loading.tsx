import { Header } from "@/components/layout/header";

export default function TradeLoading() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="bg-muted h-8 w-24 animate-pulse rounded" />
          <div className="bg-muted h-6 w-32 animate-pulse rounded" />
          <div className="bg-muted h-6 w-16 animate-pulse rounded" />
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6">
              <div className="bg-muted mb-3 h-4 w-20 animate-pulse rounded" />
              <div className="bg-muted h-8 w-32 animate-pulse rounded" />
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-lg border p-6">
            <div className="bg-muted mb-4 h-6 w-32 animate-pulse rounded" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-muted h-10 animate-pulse rounded" />
              ))}
            </div>
          </div>
          <div className="rounded-lg border p-6">
            <div className="bg-muted mb-4 h-6 w-24 animate-pulse rounded" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-muted h-10 animate-pulse rounded" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
