"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getGlossaryTerm } from "@/lib/api/glossary";
import type { GlossaryTerm } from "@/types";
import { ArrowLeft } from "lucide-react";

export function GlossaryTermContent({ term }: { term: string }) {
  const [data, setData] = useState<GlossaryTerm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getGlossaryTerm(term)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [term]);

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Link
          href="/glossary"
          className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:underline"
        >
          <ArrowLeft className="size-3" /> 용어사전으로 돌아가기
        </Link>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground text-sm">
              &apos;{decodeURIComponent(term)}&apos; 용어를 찾을 수 없습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Link
        href="/glossary"
        className="text-muted-foreground inline-flex items-center gap-1 text-sm hover:underline"
      >
        <ArrowLeft className="size-3" /> 용어사전
      </Link>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <h1 className="text-2xl font-bold">{data.term}</h1>
          <Badge variant="outline">{data.category}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">{data.definition_short}</p>
      </div>

      {/* 상세 설명 */}
      {data.definition_long && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">상세 설명</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{data.definition_long}</p>
          </CardContent>
        </Card>
      )}

      {/* 예시 */}
      {data.examples && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">활용 예시</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{data.examples}</p>
          </CardContent>
        </Card>
      )}

      {/* 관련 용어 */}
      {data.related_terms && data.related_terms.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">관련 용어</h3>
          <div className="flex flex-wrap gap-2">
            {data.related_terms.map((rt) => (
              <Link key={rt} href={`/glossary/${encodeURIComponent(rt)}`}>
                <Badge
                  variant="outline"
                  className="hover:bg-accent cursor-pointer"
                >
                  {rt}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
