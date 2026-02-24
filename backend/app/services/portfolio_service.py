"""포트폴리오 / 거래 / 분배금 비즈니스 로직."""

from __future__ import annotations

import math
from datetime import date

from supabase import Client

from app.models.portfolio import (
    DeleteResponse,
    DistributionCreateRequest,
    DistributionListResponse,
    DistributionResponse,
    HoldingStats,
    PortfolioCreateRequest,
    PortfolioDetailResponse,
    PortfolioListResponse,
    PortfolioResponse,
    TransactionCreateRequest,
    TransactionListResponse,
    TransactionResponse,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

KR_SELL_TAX_RATE = 0.002  # 한국 시장 매도세 0.20%


# ──────────────────────────────────────────────
# 헬퍼
# ──────────────────────────────────────────────


def _row_to_portfolio(row: dict) -> PortfolioResponse:
    return PortfolioResponse(**row)


def _row_to_transaction(row: dict) -> TransactionResponse:
    return TransactionResponse(**row)


def _row_to_distribution(row: dict) -> DistributionResponse:
    return DistributionResponse(**row)


def _calculate_sell_tax(price: float, quantity: int, market: str) -> float:
    """매도세 계산. KOSPI/KOSDAQ: floor(price * qty * 0.002), 해외: 0."""
    if market in ("KOSPI", "KOSDAQ"):
        return math.floor(price * quantity * KR_SELL_TAX_RATE)
    return 0.0


def _calculate_holding_stats(transactions: list[dict]) -> HoldingStats:
    """거래 내역으로 보유 통계 계산 (프론트엔드 calculateHoldingStats 포팅)."""
    quantity = 0
    total_cost = 0.0
    total_fees = 0.0
    realized_pnl = 0.0

    sorted_txs = sorted(transactions, key=lambda t: t.get("trade_date", ""))

    for tx in sorted_txs:
        fee = float(tx.get("fee", 0))
        tax = float(tx.get("tax", 0))
        total_fees += fee + tax

        tx_qty = int(tx["quantity"])
        tx_price = float(tx["price"])

        if tx["type"] == "BUY":
            total_cost += tx_price * tx_qty
            quantity += tx_qty
        else:  # SELL
            avg_cost = total_cost / quantity if quantity > 0 else 0.0
            realized_pnl += (tx_price - avg_cost) * tx_qty
            total_cost -= avg_cost * tx_qty
            quantity -= tx_qty

    if quantity < 0:
        quantity = 0
    if quantity == 0:
        total_cost = 0.0

    avg_price = total_cost / quantity if quantity > 0 else 0.0

    return HoldingStats(
        avg_price=avg_price,
        quantity=quantity,
        total_invested=total_cost,
        total_fees=total_fees,
        realized_pnl=realized_pnl,
    )


# ──────────────────────────────────────────────
# (A) 포트폴리오 CRUD
# ──────────────────────────────────────────────


def get_user_portfolios(client: Client, user_id: str) -> PortfolioListResponse:
    """사용자의 활성 포트폴리오 목록 조회."""
    resp = (
        client.table("portfolio")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_deleted", False)
        .order("created_at", desc=False)
        .execute()
    )
    portfolios = [_row_to_portfolio(r) for r in resp.data]
    return PortfolioListResponse(portfolios=portfolios, total=len(portfolios))


def get_portfolio_by_ticker(
    client: Client, user_id: str, ticker: str
) -> PortfolioResponse | None:
    """ticker로 사용자의 활성 포트폴리오 1건 조회."""
    resp = (
        client.table("portfolio")
        .select("*")
        .eq("user_id", user_id)
        .eq("ticker", ticker.upper())
        .eq("is_deleted", False)
        .limit(1)
        .execute()
    )
    if not resp.data:
        return None
    return _row_to_portfolio(resp.data[0])


def get_portfolio_detail(
    client: Client, user_id: str, portfolio_id: str
) -> PortfolioDetailResponse | None:
    """포트폴리오 상세 (거래 + 분배금 + 보유 통계)."""
    # 포트폴리오 조회
    p_resp = (
        client.table("portfolio")
        .select("*")
        .eq("id", portfolio_id)
        .eq("user_id", user_id)
        .eq("is_deleted", False)
        .single()
        .execute()
    )
    if not p_resp.data:
        return None

    portfolio = _row_to_portfolio(p_resp.data)

    # 거래 내역
    tx_resp = (
        client.table("transactions")
        .select("*")
        .eq("portfolio_id", portfolio_id)
        .eq("user_id", user_id)
        .order("trade_date", desc=False)
        .execute()
    )
    transactions = [_row_to_transaction(r) for r in tx_resp.data]

    # 분배금 내역
    dist_resp = (
        client.table("distributions")
        .select("*")
        .eq("portfolio_id", portfolio_id)
        .eq("user_id", user_id)
        .order("record_date", desc=False)
        .execute()
    )
    distributions = [_row_to_distribution(r) for r in dist_resp.data]

    # 보유 통계
    stats = _calculate_holding_stats(tx_resp.data)

    return PortfolioDetailResponse(
        portfolio=portfolio,
        transactions=transactions,
        distributions=distributions,
        stats=stats,
    )


def create_portfolio(
    client: Client, user_id: str, req: PortfolioCreateRequest
) -> PortfolioResponse:
    """포트폴리오 종목 추가. ticker 대문자 정규화 + 중복 체크."""
    ticker = req.ticker.strip().upper()

    # 중복 체크 (동일 사용자 + 동일 ticker + 활성)
    dup_resp = (
        client.table("portfolio")
        .select("id")
        .eq("user_id", user_id)
        .eq("ticker", ticker)
        .eq("is_deleted", False)
        .execute()
    )
    if dup_resp.data:
        raise ValueError(f"이미 등록된 종목입니다: {ticker}")

    row = {
        "user_id": user_id,
        "ticker": ticker,
        "company_name": req.company_name,
        "market": req.market.value,
        "sector": req.sector,
        "industry": req.industry,
        "memo": req.memo,
    }
    insert_resp = client.table("portfolio").insert(row).execute()
    return _row_to_portfolio(insert_resp.data[0])


def soft_delete_portfolio(
    client: Client, user_id: str, portfolio_id: str
) -> DeleteResponse:
    """포트폴리오 소프트 삭제 (is_deleted=True)."""
    resp = (
        client.table("portfolio")
        .update({"is_deleted": True})
        .eq("id", portfolio_id)
        .eq("user_id", user_id)
        .eq("is_deleted", False)
        .execute()
    )
    if not resp.data:
        raise ValueError("포트폴리오를 찾을 수 없습니다.")
    return DeleteResponse(message="포트폴리오가 삭제되었습니다.")


# ──────────────────────────────────────────────
# (B) 거래 CRUD
# ──────────────────────────────────────────────


def get_all_user_transactions(
    client: Client, user_id: str
) -> TransactionListResponse:
    """사용자의 모든 거래 (포트폴리오 무관) 조회."""
    resp = (
        client.table("transactions")
        .select("*")
        .eq("user_id", user_id)
        .order("trade_date", desc=False)
        .execute()
    )
    transactions = [_row_to_transaction(r) for r in resp.data]
    return TransactionListResponse(transactions=transactions, total=len(transactions))


def get_transactions(
    client: Client, user_id: str, portfolio_id: str
) -> TransactionListResponse:
    """포트폴리오의 거래 내역 목록."""
    resp = (
        client.table("transactions")
        .select("*")
        .eq("portfolio_id", portfolio_id)
        .eq("user_id", user_id)
        .order("trade_date", desc=False)
        .execute()
    )
    transactions = [_row_to_transaction(r) for r in resp.data]
    return TransactionListResponse(transactions=transactions, total=len(transactions))


def create_transaction(
    client: Client, user_id: str, req: TransactionCreateRequest
) -> TransactionResponse:
    """거래 등록. SELL 시 보유량 검증 + 매도세 자동 계산."""
    # 포트폴리오 소유권 + market 조회
    p_resp = (
        client.table("portfolio")
        .select("id, market")
        .eq("id", req.portfolio_id)
        .eq("user_id", user_id)
        .eq("is_deleted", False)
        .single()
        .execute()
    )
    if not p_resp.data:
        raise ValueError("포트폴리오를 찾을 수 없습니다.")

    market = p_resp.data["market"]
    tax = 0.0

    if req.type == "SELL":
        # 보유량 검증
        tx_resp = (
            client.table("transactions")
            .select("type, quantity")
            .eq("portfolio_id", req.portfolio_id)
            .eq("user_id", user_id)
            .execute()
        )
        buy_qty = sum(t["quantity"] for t in tx_resp.data if t["type"] == "BUY")
        sell_qty = sum(t["quantity"] for t in tx_resp.data if t["type"] == "SELL")
        holding = buy_qty - sell_qty

        if holding < req.quantity:
            raise ValueError(
                f"보유량({holding}주)이 매도수량({req.quantity}주)보다 적습니다."
            )

        # 매도세 계산
        tax = _calculate_sell_tax(req.price, req.quantity, market)

    row = {
        "portfolio_id": req.portfolio_id,
        "user_id": user_id,
        "type": req.type.value if hasattr(req.type, "value") else req.type,
        "quantity": req.quantity,
        "price": req.price,
        "fee": req.fee,
        "tax": tax,
        "trade_date": req.trade_date.isoformat(),
        "memo": req.memo,
    }
    insert_resp = client.table("transactions").insert(row).execute()
    return _row_to_transaction(insert_resp.data[0])


def delete_transaction(
    client: Client, user_id: str, tx_id: str
) -> DeleteResponse:
    """거래 하드 삭제."""
    resp = (
        client.table("transactions")
        .delete()
        .eq("id", tx_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not resp.data:
        raise ValueError("거래 내역을 찾을 수 없습니다.")
    return DeleteResponse(message="거래 내역이 삭제되었습니다.")


# ──────────────────────────────────────────────
# (C) 분배금 CRUD
# ──────────────────────────────────────────────


def get_distributions(
    client: Client, user_id: str, portfolio_id: str
) -> DistributionListResponse:
    """포트폴리오의 분배금 목록."""
    resp = (
        client.table("distributions")
        .select("*")
        .eq("portfolio_id", portfolio_id)
        .eq("user_id", user_id)
        .order("record_date", desc=False)
        .execute()
    )
    distributions = [_row_to_distribution(r) for r in resp.data]
    return DistributionListResponse(
        distributions=distributions, total=len(distributions)
    )


def create_distribution(
    client: Client, user_id: str, req: DistributionCreateRequest
) -> DistributionResponse:
    """분배금 등록. 포트폴리오 소유권 확인."""
    p_resp = (
        client.table("portfolio")
        .select("id")
        .eq("id", req.portfolio_id)
        .eq("user_id", user_id)
        .eq("is_deleted", False)
        .single()
        .execute()
    )
    if not p_resp.data:
        raise ValueError("포트폴리오를 찾을 수 없습니다.")

    row = {
        "portfolio_id": req.portfolio_id,
        "user_id": user_id,
        "amount": req.amount,
        "distribution_type": req.distribution_type.value
        if hasattr(req.distribution_type, "value")
        else req.distribution_type,
        "record_date": req.record_date.isoformat(),
        "payment_date": req.payment_date.isoformat() if req.payment_date else None,
        "memo": req.memo,
    }
    insert_resp = client.table("distributions").insert(row).execute()
    return _row_to_distribution(insert_resp.data[0])


def delete_distribution(
    client: Client, user_id: str, dist_id: str
) -> DeleteResponse:
    """분배금 하드 삭제."""
    resp = (
        client.table("distributions")
        .delete()
        .eq("id", dist_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not resp.data:
        raise ValueError("분배금 내역을 찾을 수 없습니다.")
    return DeleteResponse(message="분배금 내역이 삭제되었습니다.")


# ──────────────────────────────────────────────
# (D) 스케줄러/텔레그램 유틸리티
# ──────────────────────────────────────────────


def get_all_active_portfolios(client: Client) -> list[dict]:
    """모든 활성 포트폴리오 조회 (스케줄러 전용, user_id 필터 없음)."""
    resp = (
        client.table("portfolio")
        .select("*")
        .eq("is_deleted", False)
        .execute()
    )
    return resp.data


def get_holding_stats_for_portfolio(
    client: Client, user_id: str, portfolio_id: str
) -> HoldingStats:
    """특정 포트폴리오의 보유 통계 계산."""
    tx_resp = (
        client.table("transactions")
        .select("*")
        .eq("portfolio_id", portfolio_id)
        .eq("user_id", user_id)
        .execute()
    )
    return _calculate_holding_stats(tx_resp.data)
