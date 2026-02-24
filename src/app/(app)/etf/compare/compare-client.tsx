"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getEtfDetail } from "@/lib/api/etf";
import type { EtfFundMaster } from "@/types";
import { Plus, X } from "lucide-react";

export function CompareContent() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [etfs, setEtfs] = useState<EtfFundMaster[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    const ticker = input.trim().toUpperCase();
    if (!ticker || tickers.includes(ticker) || tickers.length >= 3) return;

    setLoading(true);
    try {
      const etf = await getEtfDetail(ticker);
      setTickers((prev) => [...prev, ticker]);
      setEtfs((prev) => [...prev, etf]);
      setInput("");
    } catch {
      // ETF not found
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (ticker: string) => {
    setTickers((prev) => prev.filter((t) => t !== ticker));
    setEtfs((prev) => prev.filter((e) => e.ticker !== ticker));
  };

  return (
    <div className="space-y-4">
      {/* 입력 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="ETF 티커 입력 (예: SPY)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="flex-1"
              disabled={tickers.length >= 3}
            />
            <Button
              onClick={handleAdd}
              disabled={loading || tickers.length >= 3}
              className="gap-1"
            >
              <Plus className="size-4" />
              추가
            </Button>
          </div>
          {tickers.length > 0 && (
            <div className="mt-2 flex gap-2">
              {tickers.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="cursor-pointer gap-1"
                  onClick={() => handleRemove(t)}
                >
                  {t}
                  <X className="size-3" />
                </Badge>
              ))}
            </div>
          )}
          <p className="text-muted-foreground mt-2 text-xs">
            최대 3개 ETF를 비교할 수 있습니다.
          </p>
        </CardContent>
      </Card>

      {loading && <Skeleton className="h-40 w-full" />}

      {/* 비교 테이블 */}
      {etfs.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ETF 비교</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium">항목</th>
                    {etfs.map((e) => (
                      <th key={e.ticker} className="py-2 text-right font-medium">
                        {e.ticker}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="text-muted-foreground py-2">이름</td>
                    {etfs.map((e) => (
                      <td key={e.ticker} className="py-2 text-right">
                        {e.name}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="text-muted-foreground py-2">유형</td>
                    {etfs.map((e) => (
                      <td key={e.ticker} className="py-2 text-right">
                        {e.asset_type}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="text-muted-foreground py-2">카테고리</td>
                    {etfs.map((e) => (
                      <td key={e.ticker} className="py-2 text-right">
                        {e.category ?? "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="text-muted-foreground py-2">보수(TER)</td>
                    {etfs.map((e) => (
                      <td key={e.ticker} className="py-2 text-right font-mono">
                        {e.ter != null ? `${e.ter}%` : "—"}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b">
                    <td className="text-muted-foreground py-2">기준가(NAV)</td>
                    {etfs.map((e) => (
                      <td key={e.ticker} className="py-2 text-right font-mono">
                        {e.nav != null ? e.nav.toLocaleString() : "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="text-muted-foreground py-2">순자산(AUM)</td>
                    {etfs.map((e) => (
                      <td key={e.ticker} className="py-2 text-right font-mono">
                        {e.aum != null ? e.aum.toLocaleString() : "—"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {etfs.length === 1 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground text-sm">
              비교하려면 ETF를 1개 더 추가해 주세요.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
