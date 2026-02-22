import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          StockAnalysis AI
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            대시보드
          </Link>
          <Link
            href="/auth/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
          >
            로그인
          </Link>
        </nav>
      </div>
    </header>
  );
}
