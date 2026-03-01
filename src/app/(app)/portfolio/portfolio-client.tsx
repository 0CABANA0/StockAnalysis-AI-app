"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Plus,
  Trash2,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

import {
  listPortfolios,
  getPortfolioDetail,
  createPortfolio,
  createTransaction,
  deletePortfolio,
  deleteTransaction,
  type Portfolio,
  type PortfolioDetail,
  type Transaction,
} from "@/lib/api/portfolio";

// ─── 상수 ───

const ACCOUNT_TABS = [
  { value: "", label: "전체" },
  { value: "GENERAL", label: "일반" },
  { value: "ISA", label: "ISA" },
  { value: "PENSION", label: "연금" },
] as const;

const MARKET_OPTIONS = [
  { value: "US", label: "미국" },
  { value: "KR", label: "한국" },
  { value: "JP", label: "일본" },
  { value: "EU", label: "유럽" },
] as const;

// ─── 헬퍼 ───

function won(v: number): string {
  return v.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
}

function pnlColor(v: number): string {
  if (v > 0) return "text-green-600";
  if (v < 0) return "text-red-600";
  return "text-muted-foreground";
}

// ─── 메인 컴포넌트 ───

export function PortfolioContent() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState("");

  // 상세 보기 상태
  const [detail, setDetail] = useState<PortfolioDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 추가 폼 토글
  const [showAddForm, setShowAddForm] = useState(false);

  async function fetchList() {
    setLoading(true);
    setError(null);
    try {
      const list = await listPortfolios(accountFilter || undefined);
      setPortfolios(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "목록 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountFilter]);

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      const res = await getPortfolioDetail(id);
      setDetail(res);
    } catch {
      setError("상세 조회 실패");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetail(null);
  }

  async function handleDelete(id: string) {
    try {
      await deletePortfolio(id);
      setDetail(null);
      fetchList();
    } catch {
      setError("삭제 실패");
    }
  }

  // ─── 상세 화면 ───
  if (detail) {
    return (
      <PortfolioDetailView
        data={detail}
        onBack={closeDetail}
        onDelete={() => handleDelete(detail.portfolio.id)}
        onRefresh={() => openDetail(detail.portfolio.id)}
      />
    );
  }

  if (detailLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // ─── 목록 화면 ───
  return (
    <div className="space-y-4">
      {/* 계좌 필터 + 추가 버튼 */}
      <div className="flex flex-wrap items-center gap-2">
        {ACCOUNT_TABS.map((tab) => (
          <Button
            key={tab.value}
            variant={accountFilter === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => setAccountFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="mr-1 size-4" />
          종목 추가
        </Button>
      </div>

      {/* 추가 폼 */}
      {showAddForm && (
        <AddPortfolioForm
          onCreated={() => {
            setShowAddForm(false);
            fetchList();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* 에러 */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="flex items-center gap-2 p-4">
            <AlertTriangle className="text-destructive size-5" />
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {/* 목록 */}
      {!loading && portfolios.length === 0 && !error && (
        <Card>
          <CardContent className="flex flex-col items-center p-12 text-center">
            <Briefcase className="text-muted-foreground mb-3 size-12" />
            <p className="font-semibold">등록된 종목이 없습니다</p>
            <p className="text-muted-foreground mt-1 text-sm">
              &ldquo;종목 추가&rdquo; 버튼으로 보유 종목을 등록하세요.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading &&
        portfolios.map((p) => (
          <Card
            key={p.id}
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => openDetail(p.id)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{p.ticker}</span>
                  <span className="text-muted-foreground text-sm">
                    {p.company_name}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">
                    {p.market}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {p.account_type}
                  </Badge>
                  {p.sector && (
                    <Badge variant="secondary" className="text-xs">
                      {p.sector}
                    </Badge>
                  )}
                </div>
              </div>
              <ChevronRight className="text-muted-foreground size-5" />
            </CardContent>
          </Card>
        ))}
    </div>
  );
}

// ─── 종목 추가 폼 ───

function AddPortfolioForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [market, setMarket] = useState("US");
  const [accountType, setAccountType] = useState("GENERAL");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ticker.trim() || !companyName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createPortfolio({
        ticker: ticker.trim().toUpperCase(),
        company_name: companyName.trim(),
        market,
        account_type: accountType,
        memo: memo.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록 실패");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">종목 추가</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="종목코드 (예: AAPL)"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              required
            />
            <Input
              placeholder="회사명 (예: Apple)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-1">
              {MARKET_OPTIONS.map((m) => (
                <Button
                  key={m.value}
                  type="button"
                  variant={market === m.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMarket(m.value)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-1">
              {ACCOUNT_TABS.filter((t) => t.value !== "").map((t) => (
                <Button
                  key={t.value}
                  type="button"
                  variant={accountType === t.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAccountType(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </div>
          </div>
          <Input
            placeholder="메모 (선택)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              취소
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "등록 중..." : "등록"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── 상세 화면 ───

function PortfolioDetailView({
  data,
  onBack,
  onDelete,
  onRefresh,
}: {
  data: PortfolioDetail;
  onBack: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const { portfolio: p, transactions, distributions, stats } = data;
  const [showTxForm, setShowTxForm] = useState(false);

  async function handleDeleteTx(txId: string) {
    try {
      await deleteTransaction(txId);
      onRefresh();
    } catch {
      /* 에러 무시 — 새로고침으로 확인 */
    }
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 size-4" />
          목록
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold">
            {p.ticker}{" "}
            <span className="text-muted-foreground text-sm font-normal">
              {p.company_name}
            </span>
          </h2>
          <div className="flex gap-1.5">
            <Badge variant="outline" className="text-xs">
              {p.market}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {p.account_type}
            </Badge>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="mr-1 size-4" />
          삭제
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="보유 수량" value={won(stats.quantity)} />
        <StatCard label="평균 단가" value={won(stats.avg_price)} />
        <StatCard label="총 투자금" value={won(stats.total_invested)} />
        <StatCard
          label="실현 손익"
          value={won(stats.realized_pnl)}
          valueClass={pnlColor(stats.realized_pnl)}
          icon={
            stats.realized_pnl >= 0 ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )
          }
        />
      </div>

      {/* 수수료 */}
      {stats.total_fees > 0 && (
        <p className="text-muted-foreground text-right text-xs">
          총 수수료/세금: {won(stats.total_fees)}
        </p>
      )}

      {/* 거래 내역 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">거래 내역</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowTxForm(!showTxForm)}
          >
            <Plus className="mr-1 size-3" />
            거래 등록
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {showTxForm && (
            <AddTransactionForm
              portfolioId={p.id}
              onCreated={() => {
                setShowTxForm(false);
                onRefresh();
              }}
              onCancel={() => setShowTxForm(false)}
            />
          )}
          {transactions.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              거래 내역이 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-2 py-1.5 text-left font-medium">일자</th>
                    <th className="px-2 py-1.5 text-left font-medium">구분</th>
                    <th className="px-2 py-1.5 text-right font-medium">
                      수량
                    </th>
                    <th className="px-2 py-1.5 text-right font-medium">
                      단가
                    </th>
                    <th className="px-2 py-1.5 text-right font-medium">
                      수수료
                    </th>
                    <th className="px-2 py-1.5 text-right font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <TransactionRow
                      key={tx.id}
                      tx={tx}
                      onDelete={() => handleDeleteTx(tx.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 배당금 */}
      {distributions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">배당/분배금</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-1.5 text-left font-medium">
                    기록일
                  </th>
                  <th className="px-2 py-1.5 text-left font-medium">유형</th>
                  <th className="px-2 py-1.5 text-right font-medium">금액</th>
                  <th className="px-2 py-1.5 text-left font-medium">메모</th>
                </tr>
              </thead>
              <tbody>
                {distributions.map((d) => (
                  <tr key={d.id} className="border-b last:border-0">
                    <td className="px-2 py-1.5">{d.record_date}</td>
                    <td className="px-2 py-1.5">
                      <Badge variant="secondary" className="text-xs">
                        {d.distribution_type}
                      </Badge>
                    </td>
                    <td className="px-2 py-1.5 text-right text-green-600">
                      +{won(d.amount)}
                    </td>
                    <td className="text-muted-foreground px-2 py-1.5 text-xs">
                      {d.memo || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* 메모 */}
      {p.memo && (
        <p className="text-muted-foreground text-sm">📝 {p.memo}</p>
      )}
    </div>
  );
}

// ─── 거래 등록 폼 ───

function AddTransactionForm({
  portfolioId,
  onCreated,
  onCancel,
}: {
  portfolioId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState("BUY");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [fee, setFee] = useState("");
  const [tradeDate, setTradeDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = Number(quantity);
    const prc = Number(price);
    if (!qty || !prc) return;

    setSubmitting(true);
    setError(null);
    try {
      await createTransaction({
        portfolio_id: portfolioId,
        type,
        quantity: qty,
        price: prc,
        fee: fee ? Number(fee) : undefined,
        trade_date: tradeDate,
        memo: memo.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "거래 등록 실패");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-muted/50 space-y-2 rounded-lg border p-3"
    >
      <div className="flex gap-2">
        <Button
          type="button"
          variant={type === "BUY" ? "default" : "outline"}
          size="sm"
          onClick={() => setType("BUY")}
        >
          매수
        </Button>
        <Button
          type="button"
          variant={type === "SELL" ? "default" : "outline"}
          size="sm"
          onClick={() => setType("SELL")}
          className={type === "SELL" ? "bg-red-600 hover:bg-red-700" : ""}
        >
          매도
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Input
          type="number"
          placeholder="수량"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="0"
          step="any"
          required
        />
        <Input
          type="number"
          placeholder="단가"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          min="0"
          step="any"
          required
        />
        <Input
          type="number"
          placeholder="수수료"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          min="0"
          step="any"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input
          type="date"
          value={tradeDate}
          onChange={(e) => setTradeDate(e.target.value)}
          required
        />
        <Input
          placeholder="메모 (선택)"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "등록 중..." : "등록"}
        </Button>
      </div>
    </form>
  );
}

// ─── 거래 행 ───

function TransactionRow({
  tx,
  onDelete,
}: {
  tx: Transaction;
  onDelete: () => void;
}) {
  const isBuy = tx.type === "BUY";
  return (
    <tr className="border-b last:border-0">
      <td className="px-2 py-1.5 text-xs">{tx.trade_date}</td>
      <td className="px-2 py-1.5">
        <Badge
          className={
            isBuy
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }
        >
          {isBuy ? "매수" : "매도"}
        </Badge>
      </td>
      <td className="px-2 py-1.5 text-right">{won(tx.quantity)}</td>
      <td className="px-2 py-1.5 text-right">{won(tx.price)}</td>
      <td className="text-muted-foreground px-2 py-1.5 text-right text-xs">
        {tx.fee > 0 ? won(tx.fee) : "—"}
      </td>
      <td className="px-2 py-1.5 text-right">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-muted-foreground hover:text-destructive p-1"
        >
          <Trash2 className="size-3.5" />
        </button>
      </td>
    </tr>
  );
}

// ─── 통계 카드 ───

function StatCard({
  label,
  value,
  valueClass,
  icon,
}: {
  label: string;
  value: string;
  valueClass?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <p className="text-muted-foreground text-xs">{label}</p>
        <div className={`mt-1 flex items-center gap-1 font-semibold ${valueClass ?? ""}`}>
          {icon}
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
