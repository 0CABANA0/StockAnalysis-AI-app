import { Header } from "@/components/layout/header";
import { AnalyzeContent } from "@/components/analyze/analyze-content";

export const metadata = {
  title: "이미지 분석 | StockAnalysis AI",
};

export default function AnalyzePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">이미지 분석</h1>
          <p className="text-muted-foreground text-sm">
            증권사 캡처 이미지를 업로드하면 AI가 포트폴리오를 자동으로
            인식합니다.
          </p>
        </div>

        <AnalyzeContent />
      </main>
    </div>
  );
}
