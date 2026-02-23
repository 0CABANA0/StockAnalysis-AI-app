import { Header } from "@/components/layout/header";

export default function AnalyzeLoading() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <div className="bg-muted h-8 w-32 animate-pulse rounded" />
          <div className="bg-muted mt-2 h-4 w-64 animate-pulse rounded" />
        </div>

        <div className="mb-8 rounded-lg border p-6">
          <div className="bg-muted h-[200px] animate-pulse rounded" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-6">
              <div className="bg-muted mb-3 h-10 w-10 animate-pulse rounded" />
              <div className="bg-muted mb-2 h-4 w-20 animate-pulse rounded" />
              <div className="bg-muted h-8 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
