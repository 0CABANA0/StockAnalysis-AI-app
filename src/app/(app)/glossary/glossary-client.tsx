"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { getGlossaryTerms } from "@/lib/api/glossary";
import type { GlossaryTerm } from "@/types";

const categories = [
  "거시경제",
  "기술적분석",
  "지정학",
  "ETF펀드",
  "투자전략",
];

export function GlossaryContent() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchTerms = async () => {
      try {
        const res = await getGlossaryTerms(selectedCategory ?? undefined);
        if (!cancelled) setTerms(res.terms);
      } catch {
        if (!cancelled) {
          setTerms([]);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchTerms();
    return () => { cancelled = true; };
  }, [selectedCategory, retryKey]);

  // 카테고리 변경 시 로딩 상태 리셋
  const handleCategoryChange = (cat: string | null) => {
    setLoading(true);
    setSelectedCategory(cat);
  };

  return (
    <div className="space-y-4">
      {/* 카테고리 필터 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryChange(null)}
          className={`rounded-full border px-3 py-1 text-sm transition-colors ${
            selectedCategory === null
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent"
          }`}
        >
          전체
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "hover:bg-accent"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 용어 목록 */}
      {error ? (
        <ErrorState
          message="용어사전을 불러올 수 없습니다."
          onRetry={() => {
            setError(false);
            setLoading(true);
            setRetryKey((k) => k + 1);
          }}
        />
      ) : loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : terms.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground text-sm">
              등록된 용어가 없습니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {terms.map((term) => (
            <Link key={term.term} href={`/glossary/${encodeURIComponent(term.term)}`}>
              <Card className="hover:bg-accent/50 h-full transition-colors">
                <CardContent className="p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium">{term.term}</span>
                    <Badge variant="outline" className="text-xs">
                      {term.category}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {term.definition_short}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
