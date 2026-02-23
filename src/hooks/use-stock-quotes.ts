"use client";

import { useEffect, useState } from "react";
import { fetchMultipleQuotes } from "@/lib/api/stock";

interface UseStockQuotesResult {
  quotes: Map<string, number>; // ticker → price
  loading: boolean;
}

export function useStockQuotes(tickers: string[]): UseStockQuotesResult {
  const [quotes, setQuotes] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(false);

  // 안정적인 키 생성 (tickers 배열 변경 감지용)
  const tickerKey = tickers.slice().sort().join(",");

  useEffect(() => {
    if (tickers.length === 0) return;

    let cancelled = false;
    setLoading(true);

    fetchMultipleQuotes(tickers)
      .then((results) => {
        if (cancelled) return;
        const map = new Map<string, number>();
        for (const q of results) {
          if (q.price != null) {
            map.set(q.ticker, q.price);
          }
        }
        setQuotes(map);
      })
      .catch(() => {
        // 백엔드 미연결 시 빈 Map 유지 (graceful degradation)
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickerKey]);

  return { quotes, loading };
}
