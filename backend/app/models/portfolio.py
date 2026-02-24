"""포트폴리오 / 거래 / 분배금 Pydantic 모델."""

from datetime import date, datetime
from enum import Enum

from pydantic import BaseModel, Field


# --- Enum ---


class MarketType(str, Enum):
    KOSPI = "KOSPI"
    KOSDAQ = "KOSDAQ"
    NYSE = "NYSE"
    NASDAQ = "NASDAQ"


class TransactionType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


class AccountType(str, Enum):
    GENERAL = "GENERAL"     # 일반 위탁
    ISA = "ISA"             # ISA
    PENSION = "PENSION"     # 연금저축


class DistributionType(str, Enum):
    DIVIDEND = "DIVIDEND"
    DISTRIBUTION = "DISTRIBUTION"
    INTEREST = "INTEREST"


# --- 요청 모델 ---


class PortfolioCreateRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=20)
    company_name: str = Field(..., min_length=1, max_length=100)
    market: MarketType
    account_type: AccountType = AccountType.GENERAL
    sector: str | None = None
    industry: str | None = None
    memo: str | None = None


class TransactionCreateRequest(BaseModel):
    portfolio_id: str
    type: TransactionType
    quantity: int = Field(..., gt=0)
    price: float = Field(..., gt=0)
    fee: float = Field(default=0, ge=0)
    trade_date: date
    memo: str | None = None


class DistributionCreateRequest(BaseModel):
    portfolio_id: str
    amount: float = Field(..., gt=0)
    distribution_type: DistributionType
    record_date: date
    payment_date: date | None = None
    memo: str | None = None


# --- 응답 모델 ---


class PortfolioResponse(BaseModel):
    id: str
    user_id: str
    ticker: str
    company_name: str
    market: str
    account_type: str = "GENERAL"
    sector: str | None = None
    industry: str | None = None
    memo: str | None = None
    is_deleted: bool = False
    deleted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class TransactionResponse(BaseModel):
    id: str
    portfolio_id: str
    user_id: str
    type: str
    quantity: int
    price: float
    fee: float
    tax: float
    trade_date: str
    memo: str | None = None
    created_at: datetime


class DistributionResponse(BaseModel):
    id: str
    portfolio_id: str
    user_id: str
    amount: float
    distribution_type: str
    record_date: str
    payment_date: str | None = None
    memo: str | None = None
    created_at: datetime


class HoldingStats(BaseModel):
    avg_price: float = 0
    quantity: int = 0
    total_invested: float = 0
    total_fees: float = 0
    realized_pnl: float = 0


class PortfolioListResponse(BaseModel):
    portfolios: list[PortfolioResponse]
    total: int


class PortfolioDetailResponse(BaseModel):
    portfolio: PortfolioResponse
    transactions: list[TransactionResponse]
    distributions: list[DistributionResponse]
    stats: HoldingStats


class TransactionListResponse(BaseModel):
    transactions: list[TransactionResponse]
    total: int


class DistributionListResponse(BaseModel):
    distributions: list[DistributionResponse]
    total: int


class DeleteResponse(BaseModel):
    success: bool = True
    message: str
