export default function DashboardPage() {
  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-gray-600 dark:text-gray-400">
          주식 분석 개요를 확인하세요
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* 요약 카드 */}
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-500">총 포트폴리오</h3>
          <p className="mt-2 text-3xl font-bold">₩0</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-500">일일 수익률</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">+0.00%</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-500">보유 종목</h3>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-500">AI 분석</h3>
          <p className="mt-2 text-3xl font-bold">0건</p>
        </div>
      </div>

      {/* 차트 영역 placeholder */}
      <div className="mt-8 rounded-xl border border-gray-200 p-8 dark:border-gray-800">
        <h2 className="mb-4 text-xl font-semibold">포트폴리오 추이</h2>
        <div className="flex h-64 items-center justify-center text-gray-400">
          차트가 여기에 표시됩니다
        </div>
      </div>
    </div>
  );
}
