export default function AdminPage() {
  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">관리자 패널</h1>
        <p className="text-gray-600 dark:text-gray-400">
          시스템 관리 및 사용자 관리
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-500">전체 사용자</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-500">활성 세션</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-500">API 호출</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
      </div>

      {/* 사용자 테이블 placeholder */}
      <div className="mt-8 rounded-xl border border-gray-200 p-8 dark:border-gray-800">
        <h2 className="mb-4 text-xl font-semibold">사용자 목록</h2>
        <div className="flex h-48 items-center justify-center text-gray-400">
          사용자 목록이 여기에 표시됩니다
        </div>
      </div>
    </div>
  );
}
