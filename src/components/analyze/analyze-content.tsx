"use client";

import { useState } from "react";
import { ImageIcon, Shield, Upload } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { ImageAnalysisResponse } from "@/lib/api/image";

import { AnalysisResult } from "./analysis-result";
import { ImageUpload } from "./image-upload";

export function AnalyzeContent() {
  const [result, setResult] = useState<ImageAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResult = (data: ImageAnalysisResponse) => {
    setError(null);
    setResult(data);
  };

  const handleError = (msg: string) => {
    setError(msg);
  };

  return (
    <>
      {/* 에러 메시지 */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 업로드 */}
      <ImageUpload onResult={handleResult} onError={handleError} />

      {/* 분석 결과 */}
      {result ? (
        <AnalysisResult result={result} />
      ) : (
        /* 기능 설명 (결과 없을 때만) */
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
      )}

      <p className="text-muted-foreground mt-6 text-center text-xs">
        * AI 분석 결과는 투자 참고용이며, 최종 투자 판단의 책임은 본인에게
        있습니다.
      </p>
    </>
  );
}
