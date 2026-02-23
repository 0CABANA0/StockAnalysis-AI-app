"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Loader2, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { analyzeImage, type ImageAnalysisResponse } from "@/lib/api/image";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

interface ImageUploadProps {
  onResult: (result: ImageAnalysisResponse) => void;
  onError: (error: string) => void;
}

export function ImageUpload({ onResult, onError }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        onError("지원하지 않는 형식입니다. PNG, JPG, WEBP만 가능합니다.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        onError("이미지 크기가 10MB를 초과합니다.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setPreview(dataUrl);
        setFileName(file.name);
      };
      reader.readAsDataURL(file);
    },
    [onError],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleClear = () => {
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!preview) return;

    setLoading(true);
    try {
      // data:image/png;base64,xxxx → base64 부분만 추출
      const [header, base64Data] = preview.split(",");
      const mediaType = header.match(/data:(.*?);/)?.[1] ?? "image/png";

      const result = await analyzeImage(base64Data, mediaType);
      onResult(result);
    } catch (err) {
      onError(
        err instanceof Error ? err.message : "이미지 분석에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-base">이미지 업로드</CardTitle>
      </CardHeader>
      <CardContent>
        {!preview ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "hover:border-primary/50"
            }`}
          >
            <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
              <Upload className="text-muted-foreground size-8" />
            </div>
            <p className="mb-2 text-sm font-medium">
              이미지를 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-muted-foreground text-xs">
              PNG, JPG, WEBP (최대 10MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg border">
              <Image
                src={preview}
                alt="업로드 미리보기"
                width={800}
                height={400}
                unoptimized
                className="mx-auto max-h-[400px] w-auto object-contain"
              />
              {!loading && (
                <button
                  onClick={handleClear}
                  className="bg-background/80 hover:bg-background absolute top-2 right-2 rounded-full p-1.5 shadow-sm"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">{fileName}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={loading}
                >
                  취소
                </Button>
                <Button size="sm" onClick={handleAnalyze} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    "AI 분석 시작"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </CardContent>
    </Card>
  );
}
