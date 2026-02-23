import { Header } from "@/components/layout/header";

export default function ReportLoading() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="bg-muted mt-2 h-4 w-64 animate-pulse rounded" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border p-6 lg:col-span-1">
            <div className="bg-muted mb-6 h-6 w-24 animate-pulse rounded" />
            <div className="bg-muted mx-auto mb-6 h-16 w-16 animate-pulse rounded" />
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i}>
                  <div className="bg-muted mb-2 h-4 w-full animate-pulse rounded" />
                  <div className="bg-muted h-2 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border p-6 lg:col-span-2">
            <div className="bg-muted mb-4 h-6 w-32 animate-pulse rounded" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-muted h-4 animate-pulse rounded" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
