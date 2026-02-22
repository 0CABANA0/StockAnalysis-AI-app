import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-4xl font-bold">404</h2>
      <p className="text-gray-600 dark:text-gray-400">
        페이지를 찾을 수 없습니다.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
