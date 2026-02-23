import type { Transaction, MarketType } from "@/types";

// ── 보유 통계 ──

export interface HoldingStats {
  avgPrice: number;
  quantity: number;
  totalInvested: number;
  totalFees: number;
  realizedPnL: number;
}

export function calculateHoldingStats(
  transactions: Transaction[],
): HoldingStats {
  let quantity = 0;
  let totalCost = 0;
  let totalFees = 0;
  let realizedPnL = 0;

  const sorted = [...transactions].sort(
    (a, b) =>
      new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime(),
  );

  for (const tx of sorted) {
    totalFees += tx.fee + tx.tax;

    if (tx.type === "BUY") {
      totalCost += tx.price * tx.quantity;
      quantity += tx.quantity;
    } else {
      // SELL: 평균 매수가 기준 실현손익 계산
      const avgCost = quantity > 0 ? totalCost / quantity : 0;
      realizedPnL += (tx.price - avgCost) * tx.quantity;
      totalCost -= avgCost * tx.quantity;
      quantity -= tx.quantity;
    }
  }

  // 음수 보유량 방지
  if (quantity < 0) quantity = 0;
  if (quantity === 0) totalCost = 0;

  const avgPrice = quantity > 0 ? totalCost / quantity : 0;

  return {
    avgPrice,
    quantity,
    totalInvested: totalCost,
    totalFees,
    realizedPnL,
  };
}

// ── 미실현 손익 ──

export interface UnrealizedPnL {
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export function calculateUnrealizedPnL(
  stats: HoldingStats,
  currentPrice: number,
): UnrealizedPnL {
  const marketValue = currentPrice * stats.quantity;
  const unrealizedPnL = marketValue - stats.totalInvested;
  const unrealizedPnLPercent =
    stats.totalInvested > 0 ? (unrealizedPnL / stats.totalInvested) * 100 : 0;

  return {
    currentPrice,
    marketValue,
    unrealizedPnL,
    unrealizedPnLPercent,
  };
}

// ── 현재가 대용 (최근 BUY 거래 가격) ──

export function getLatestBuyPrice(transactions: Transaction[]): number {
  const buys = transactions
    .filter((tx) => tx.type === "BUY")
    .sort(
      (a, b) =>
        new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime(),
    );
  return buys.length > 0 ? buys[0].price : 0;
}

// ── 통화 포맷 ──

const krwFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatKRW(amount: number): string {
  return krwFormatter.format(amount);
}

export function formatUSD(amount: number): string {
  return usdFormatter.format(amount);
}

export function formatCurrency(amount: number, market: MarketType): string {
  return market === "KOSPI" || market === "KOSDAQ"
    ? formatKRW(amount)
    : formatUSD(amount);
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

// ── 매도 세금 (한국 시장 0.20%) ──

const KR_SELL_TAX_RATE = 0.002;

export function calculateSellTax(
  price: number,
  quantity: number,
  market: MarketType,
): number {
  if (market === "KOSPI" || market === "KOSDAQ") {
    return Math.floor(price * quantity * KR_SELL_TAX_RATE);
  }
  return 0;
}
