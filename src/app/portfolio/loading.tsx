import { Header } from "@/components/layout/header";

export default function PortfolioLoading() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="bg-muted h-8 w-36 animate-pulse rounded" />
            <div className="bg-muted mt-2 h-4 w-56 animate-pulse rounded" />
          </div>
          <div className="bg-muted h-10 w-28 animate-pulse rounded" />
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6">
              <div className="bg-muted mb-3 h-4 w-20 animate-pulse rounded" />
              <div className="bg-muted h-8 w-32 animate-pulse rounded" />
            </div>
          ))}
        </div>

        <div className="rounded-lg border p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-muted h-10 animate-pulse rounded" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
