import { Upload, ImageIcon, Shield } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

        {/* 업로드 영역 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">이미지 업로드</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12">
              <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
                <Upload className="text-muted-foreground size-8" />
              </div>
              <p className="mb-2 text-sm font-medium">
                이미지를 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-muted-foreground text-xs">
                PNG, JPG, WEBP (최대 10MB)
              </p>
              <p className="text-muted-foreground mt-4 text-xs">
                백엔드(FastAPI + Claude Vision) 연동 후 활성화됩니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 기능 설명 */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="bg-muted mb-3 flex size-10 items-center justify-center rounded-lg">
                <ImageIcon className="size-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold">OCR 인식</h3>
              <p className="text-muted-foreground text-xs">
                Claude Vision이 증권사 화면에서 종목, 수량, 가격 정보를 자동
                추출합니다.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="bg-muted mb-3 flex size-10 items-center justify-center rounded-lg">
                <Upload className="size-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold">자동 등록</h3>
              <p className="text-muted-foreground text-xs">
                인식된 종목이 포트폴리오에 자동으로 등록되고, AI 투자 가이드를
                제공합니다.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="bg-muted mb-3 flex size-10 items-center justify-center rounded-lg">
                <Shield className="size-5" />
              </div>
              <h3 className="mb-1 text-sm font-semibold">보안</h3>
              <p className="text-muted-foreground text-xs">
                업로드된 이미지는 분석 즉시 삭제되며, 개인 식별 정보는 자동
                마스킹됩니다.
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="text-muted-foreground mt-6 text-center text-xs">
          * AI 분석 결과는 투자 참고용이며, 최종 투자 판단의 책임은 본인에게
          있습니다.
        </p>
      </main>
    </div>
  );
}
