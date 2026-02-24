import { apiFetch } from "./client";
import type { Watchlist } from "@/types";

interface WatchlistResponse {
  items: Watchlist[];
  total: number;
}

interface WatchlistAddRequest {
  ticker: string;
  company_name: string;
  market: string;
  asset_type?: string;
}

export async function getWatchlist(): Promise<WatchlistResponse> {
  return apiFetch<WatchlistResponse>("/watchlist/");
}

export async function addToWatchlist(
  data: WatchlistAddRequest,
): Promise<Watchlist> {
  return apiFetch<Watchlist>("/watchlist/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function removeFromWatchlist(itemId: string): Promise<void> {
  await apiFetch(`/watchlist/${itemId}`, { method: "DELETE" });
}
