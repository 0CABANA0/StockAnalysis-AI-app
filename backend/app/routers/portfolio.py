"""포트폴리오 / 거래 / 분배금 API 엔드포인트."""

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user
from app.models.portfolio import (
    DeleteResponse,
    DistributionCreateRequest,
    DistributionListResponse,
    PortfolioCreateRequest,
    PortfolioDetailResponse,
    PortfolioListResponse,
    PortfolioResponse,
    TransactionCreateRequest,
    TransactionListResponse,
)
from app.services import portfolio_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


# ──────────────────────────────────────────────
# 정적 경로 (동적 {id} 경로보다 먼저 등록)
# ──────────────────────────────────────────────


@router.get("/my", response_model=PortfolioListResponse)
def get_my_portfolios(
    account_type: str | None = Query(default=None),
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """내 포트폴리오 목록 조회. account_type 필터 옵션."""
    logger.info("포트폴리오 목록 조회: user=%s, account_type=%s", user.user_id, account_type)
    return portfolio_service.get_user_portfolios(client, user.user_id, account_type)


@router.get("/my/transactions", response_model=TransactionListResponse)
def get_my_transactions(
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """내 전체 거래 내역 조회 (포트폴리오 무관)."""
    logger.info("전체 거래 내역 조회: user=%s", user.user_id)
    return portfolio_service.get_all_user_transactions(client, user.user_id)


@router.get("/my/by-ticker/{ticker}", response_model=PortfolioResponse | None)
def get_my_portfolio_by_ticker(
    ticker: str,
    account_type: str | None = Query(default=None),
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """ticker로 내 포트폴리오 조회. account_type 필터 옵션."""
    logger.info("ticker 포트폴리오 조회: user=%s, ticker=%s, account_type=%s", user.user_id, ticker, account_type)
    return portfolio_service.get_portfolio_by_ticker(client, user.user_id, ticker, account_type)


@router.post("/", response_model=None, status_code=201)
def create_portfolio(
    req: PortfolioCreateRequest,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """포트폴리오 종목 추가."""
    logger.info("포트폴리오 추가: user=%s, ticker=%s", user.user_id, req.ticker)
    try:
        return portfolio_service.create_portfolio(client, user.user_id, req)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.post("/transaction", response_model=None, status_code=201)
def create_transaction(
    req: TransactionCreateRequest,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """거래 등록."""
    logger.info(
        "거래 등록: user=%s, portfolio=%s, type=%s",
        user.user_id,
        req.portfolio_id,
        req.type,
    )
    try:
        return portfolio_service.create_transaction(client, user.user_id, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/transaction/{tx_id}", response_model=DeleteResponse)
def delete_transaction(
    tx_id: str,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """거래 삭제."""
    logger.info("거래 삭제: user=%s, tx_id=%s", user.user_id, tx_id)
    try:
        return portfolio_service.delete_transaction(client, user.user_id, tx_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/distribution", response_model=None, status_code=201)
def create_distribution(
    req: DistributionCreateRequest,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """분배금 등록."""
    logger.info(
        "분배금 등록: user=%s, portfolio=%s", user.user_id, req.portfolio_id
    )
    try:
        return portfolio_service.create_distribution(client, user.user_id, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/distribution/{dist_id}", response_model=DeleteResponse)
def delete_distribution(
    dist_id: str,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """분배금 삭제."""
    logger.info("분배금 삭제: user=%s, dist_id=%s", user.user_id, dist_id)
    try:
        return portfolio_service.delete_distribution(client, user.user_id, dist_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ──────────────────────────────────────────────
# 동적 경로
# ──────────────────────────────────────────────


@router.get("/{portfolio_id}/detail", response_model=PortfolioDetailResponse)
def get_portfolio_detail(
    portfolio_id: str,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """포트폴리오 상세 (거래 + 분배금 + 보유 통계)."""
    logger.info(
        "포트폴리오 상세 조회: user=%s, id=%s", user.user_id, portfolio_id
    )
    result = portfolio_service.get_portfolio_detail(
        client, user.user_id, portfolio_id
    )
    if result is None:
        raise HTTPException(status_code=404, detail="포트폴리오를 찾을 수 없습니다.")
    return result


@router.get("/{portfolio_id}/transactions", response_model=TransactionListResponse)
def get_transactions(
    portfolio_id: str,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """포트폴리오의 거래 내역 목록."""
    logger.info(
        "거래 내역 조회: user=%s, portfolio=%s", user.user_id, portfolio_id
    )
    return portfolio_service.get_transactions(client, user.user_id, portfolio_id)


@router.get("/{portfolio_id}/distributions", response_model=DistributionListResponse)
def get_distributions(
    portfolio_id: str,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """포트폴리오의 분배금 목록."""
    logger.info(
        "분배금 내역 조회: user=%s, portfolio=%s", user.user_id, portfolio_id
    )
    return portfolio_service.get_distributions(client, user.user_id, portfolio_id)


@router.delete("/{portfolio_id}", response_model=DeleteResponse)
def delete_portfolio(
    portfolio_id: str,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """포트폴리오 소프트 삭제."""
    logger.info(
        "포트폴리오 삭제: user=%s, id=%s", user.user_id, portfolio_id
    )
    try:
        return portfolio_service.soft_delete_portfolio(
            client, user.user_id, portfolio_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
