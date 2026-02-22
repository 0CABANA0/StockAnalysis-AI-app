"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-bold">문제가 발생했습니다</h2>
      <p className="text-gray-600 dark:text-gray-400">
        예기치 않은 오류가 발생했습니다.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700"
      >
        다시 시도
      </button>
    </div>
  );
}
