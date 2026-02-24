"use client";

import { useState, useRef } from "react";
import Image from "next/image";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { analyzeImage } from "@/lib/api/image";
import { Camera, Upload, Loader2 } from "lucide-react";

interface RecognizedHolding {
  ticker: string | null;
  name: string;
  quantity: number | null;
  avg_price: number | null;
  current_price: number | null;
  profit_loss_rate: number | null;
  confidence: number;
  verified: boolean;
}

interface SectorAnalysis {
  name: string;
  weight_pct: number;
  assessment: string;
}

interface HoldingRecommendation {
  ticker: string | null;
  name: string;
  opinion: string;
  rationale: string;
  target_price: number | null;
  stop_loss: number | null;
}

interface InvestmentGuide {
  diagnosis: string;
  sector_analysis: SectorAnalysis[];
  recommendations: HoldingRecommendation[];
  risk_level: string;
  action_plan: {
    this_week: string[];
    this_month: string[];
    three_months: string[];
  };
}

interface AnalysisResult {
  holdings: RecognizedHolding[];
  investment_guide: InvestmentGuide | null;
  validation_status: string;
  processing_time_ms: number;
}

const opinionColor: Record<string, string> = {
  STRONG_BUY: "text-green-700 bg-green-100",
  BUY: "text-green-600 bg-green-50",
  HOLD: "text-yellow-600 bg-yellow-50",
  SELL: "text-red-600 bg-red-50",
  STRONG_SELL: "text-red-700 bg-red-100",
};

const opinionLabel: Record<string, string> = {
  STRONG_BUY: "적극 매수",
  BUY: "매수",
  HOLD: "보유",
  SELL: "매도",
  STRONG_SELL: "적극 매도",
};

export function AnalyzeContent() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setError("JPEG, PNG, WebP 이미지만 지원합니다.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("이미지 크기가 10MB를 초과합니다.");
      return;
    }

    setError(null);
    setResult(null);
    setLoading(true);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Base64 인코딩
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    const base64 = btoa(binary);
    const mediaType = file.type.replace("image/", "");

    try {
      const res = await analyzeImage(base64, mediaType);
      setResult(res as AnalysisResult);
    } catch {
      setError("이미지 분석에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 업로드 영역 */}
      <Card>
        <CardContent className="p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-muted-foreground/30 hover:border-primary flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed p-12 transition-colors"
          >
            {preview ? (
              <Image
                src={preview}
                alt="업로드 미리보기"
                width={400}
                height={192}
                className="mb-3 max-h-48 rounded-lg object-contain"
                unoptimized
              />
            ) : (
              <Upload className="text-muted-foreground mb-3 size-12" />
            )}
            <p className="font-semibold">
              {loading ? "분석 중..." : "이미지를 클릭하여 업로드"}
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              JPEG, PNG, WebP / 최대 10MB
            </p>
          </div>
          {loading && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">AI가 보유 종목을 분석하고 있습니다...</span>
            </div>
          )}
          {error && (
            <p className="mt-3 text-center text-sm text-red-600">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* 분석 결과 */}
      {result && (
        <>
          {/* 인식된 종목 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                인식된 종목 ({result.holdings.length}건)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.holdings.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{h.name}</span>
                        {h.ticker && (
                          <Badge variant="outline" className="text-xs">
                            {h.ticker}
                          </Badge>
                        )}
                        {h.verified && (
                          <Badge className="text-xs">검증됨</Badge>
                        )}
                      </div>
                      {h.quantity != null && (
                        <p className="text-muted-foreground text-xs">
                          {h.quantity}주
                          {h.avg_price != null &&
                            ` · 평균 ${h.avg_price.toLocaleString()}원`}
                        </p>
                      )}
                    </div>
                    {h.profit_loss_rate != null && (
                      <span
                        className={`text-sm font-medium ${
                          h.profit_loss_rate >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {h.profit_loss_rate > 0 ? "+" : ""}
                        {h.profit_loss_rate.toFixed(2)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 투자 가이드 */}
          {result.investment_guide && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">포트폴리오 진단</CardTitle>
                    <Badge
                      variant={
                        result.investment_guide.risk_level === "HIGH"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      위험도: {result.investment_guide.risk_level}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">
                    {result.investment_guide.diagnosis}
                  </p>
                </CardContent>
              </Card>

              {/* 종목별 추천 */}
              {result.investment_guide.recommendations.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">종목별 가이드</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.investment_guide.recommendations.map((rec, i) => (
                        <div key={i} className="rounded-lg border p-3">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="font-medium">{rec.name}</span>
                            <Badge
                              className={`text-xs ${opinionColor[rec.opinion] ?? ""}`}
                            >
                              {opinionLabel[rec.opinion] ?? rec.opinion}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            {rec.rationale}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 액션 플랜 */}
              {(result.investment_guide.action_plan.this_week.length > 0 ||
                result.investment_guide.action_plan.this_month.length > 0) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">액션 플랜</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.investment_guide.action_plan.this_week.length >
                        0 && (
                        <div>
                          <p className="mb-1 text-sm font-medium">이번 주</p>
                          <ul className="list-inside list-disc space-y-1 text-sm">
                            {result.investment_guide.action_plan.this_week.map(
                              (a, i) => (
                                <li key={i}>{a}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                      {result.investment_guide.action_plan.this_month.length >
                        0 && (
                        <div>
                          <p className="mb-1 text-sm font-medium">이번 달</p>
                          <ul className="list-inside list-disc space-y-1 text-sm">
                            {result.investment_guide.action_plan.this_month.map(
                              (a, i) => (
                                <li key={i}>{a}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          <p className="text-muted-foreground text-right text-xs">
            처리 시간: {result.processing_time_ms}ms
          </p>
        </>
      )}
    </div>
  );
}
