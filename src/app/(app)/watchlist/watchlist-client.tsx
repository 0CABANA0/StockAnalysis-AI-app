"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/api/watchlist";
import type { Watchlist } from "@/types";
import { Star, Plus, Trash2, TrendingUp } from "lucide-react";

export function WatchlistContent() {
  const [items, setItems] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    getWatchlist()
      .then((res) => setItems(res.items))
      .catch(() => {
        setItems([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim() || !companyName.trim() || adding) return;

    setAdding(true);
    try {
      await addToWatchlist({
        ticker: ticker.trim().toUpperCase(),
        company_name: companyName.trim(),
        market: "US",
      });
      setTicker("");
      setCompanyName("");
      setShowAdd(false);
      fetchData();
    } catch {
      // 에러 처리
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeFromWatchlist(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch {
      // 에러 처리
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="관심종목을 불러올 수 없습니다."
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* 추가 버튼 */}
      <Button
        variant="outline"
        onClick={() => setShowAdd(!showAdd)}
        className="gap-2"
      >
        <Plus className="size-4" />
        종목 추가
      </Button>

      {/* 추가 폼 */}
      {showAdd && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleAdd} className="flex gap-2">
              <Input
                placeholder="티커 (예: AAPL)"
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-32"
              />
              <Input
                placeholder="회사명 (예: 애플)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={adding}>
                {adding ? "추가 중..." : "추가"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 관심종목 목록 */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center">
            <Star className="text-muted-foreground mb-3 size-12" />
            <p className="font-semibold">아직 등록된 관심종목이 없습니다</p>
            <p className="text-muted-foreground mt-1 text-sm">
              종목을 추가하여 관심 목록을 만들어 보세요
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex items-center gap-3 p-4">
                <Star className="size-4 shrink-0 text-yellow-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.company_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.ticker}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {item.market} · {item.asset_type}
                  </p>
                </div>
                <Link href={`/guide/${item.ticker}`}>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <TrendingUp className="size-3" />
                    가이드
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleRemove(item.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
