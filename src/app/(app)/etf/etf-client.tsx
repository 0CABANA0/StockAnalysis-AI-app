"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { getEtfList, getMacroEtfSuggestions } from "@/lib/api/etf";
import type { EtfFundMaster } from "@/types";
import { Search } from "lucide-react";

interface MacroSuggestion {
  scenario: string;
  tickers: string[];
  rationale: string;
  relevance_score: number;
}

const assetTypes = [
  { key: "", label: "전체" },
  { key: "DOMESTIC_ETF", label: "국내 ETF" },
  { key: "FOREIGN_ETF", label: "해외 ETF" },
  { key: "DOMESTIC_FUND", label: "국내 펀드" },
];

export function EtfContent() {
  const [items, setItems] = useState<EtfFundMaster[]>([]);
  const [total, setTotal] = useState(0);
  const [suggestions, setSuggestions] = useState<MacroSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [assetType, setAssetType] = useState("");

  const handleTypeChange = (type: string) => {
    setAssetType(type);
    setLoading(true);
  };

  // ETF 목록 로드
  useEffect(() => {
    let cancelled = false;
    const fetchEtfs = async () => {
      try {
        const res = await getEtfList({
          asset_type: assetType || undefined,
          limit: 30,
          sort_by: "name",
        });
        if (!cancelled) {
          setItems(res.items);
          setTotal(res.total);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
          setError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchEtfs();
    return () => { cancelled = true; };
  }, [assetType, retryKey]);

  // 거시경제 기반 추천
  useEffect(() => {
    getMacroEtfSuggestions()
      .then((res) => setSuggestions(res.suggestions))
      .catch(() => setSuggestions([]));
  }, []);

  return (
    <div className="space-y-6">
      {/* 거시경제 기반 추천 */}
      {suggestions.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">
            현재 시장 상황 기반 ETF 추천
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {suggestions.map((s, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <p className="mb-1 text-sm font-medium">{s.scenario}</p>
                  <p className="text-muted-foreground mb-2 text-xs">
                    {s.rationale}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {s.tickers.map((t) => (
                      <Link key={t} href={`/etf/${t}`}>
                        <Badge variant="secondary" className="cursor-pointer text-xs">
                          {t}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 유형 필터 */}
      <div className="flex flex-wrap gap-2">
        {assetTypes.map((t) => (
          <Button
            key={t.key}
            variant={assetType === t.key ? "default" : "outline"}
            size="sm"
            onClick={() => handleTypeChange(t.key)}
          >
            {t.label}
          </Button>
        ))}
        <Link href="/etf/compare">
          <Button variant="outline" size="sm" className="gap-1">
            <Search className="size-3" />
            ETF 비교
          </Button>
        </Link>
      </div>

      {/* ETF 목록 */}
      {error ? (
        <ErrorState
          message="ETF 데이터를 불러올 수 없습니다."
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
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground text-sm">
              등록된 ETF/펀드가 없습니다. 관리자가 동기화를 실행하면 데이터가 표시됩니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-muted-foreground text-xs">총 {total}건</p>
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((etf) => (
              <Link key={etf.id} href={`/etf/${etf.ticker}`}>
                <Card className="hover:bg-accent/50 h-full transition-colors">
                  <CardContent className="p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-medium">{etf.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {etf.ticker}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-3 text-xs">
                      {etf.category && <span>{etf.category}</span>}
                      {etf.ter != null && <span>수수료 {etf.ter}%</span>}
                      {etf.aum != null && (
                        <span>
                          AUM{" "}
                          {etf.aum >= 1_000_000_000
                            ? `${(etf.aum / 1_000_000_000).toFixed(1)}B`
                            : etf.aum >= 1_000_000
                              ? `${(etf.aum / 1_000_000).toFixed(0)}M`
                              : etf.aum.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
