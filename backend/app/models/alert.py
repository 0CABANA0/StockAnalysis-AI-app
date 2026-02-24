"""알림 시스템 Pydantic 모델."""

from datetime import datetime

from pydantic import BaseModel, field_validator


class PriceAlertCreateRequest(BaseModel):
    """가격 알림 생성 요청."""

    ticker: str
    company_name: str | None = None
    alert_type: str  # TARGET_PRICE | STOP_LOSS
    trigger_price: float
    memo: str | None = None

    @field_validator("ticker")
    @classmethod
    def normalize_ticker(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("alert_type")
    @classmethod
    def validate_alert_type(cls, v: str) -> str:
        allowed = {"TARGET_PRICE", "STOP_LOSS"}
        if v not in allowed:
            raise ValueError(f"alert_type은 {allowed} 중 하나여야 합니다.")
        return v

    @field_validator("trigger_price")
    @classmethod
    def validate_trigger_price(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("trigger_price는 0보다 커야 합니다.")
        return v


class DeleteResponse(BaseModel):
    """삭제 결과 응답."""

    success: bool = True
    message: str


class PriceAlertResponse(BaseModel):
    """DB price_alerts 테이블 1:1 대응."""

    id: str
    user_id: str
    ticker: str
    company_name: str | None = None
    alert_type: str  # TARGET_PRICE | STOP_LOSS | DAILY_CHANGE
    trigger_price: float
    current_price: float | None = None
    is_triggered: bool = False
    triggered_at: datetime | None = None
    memo: str | None = None
    created_at: datetime


class PriceAlertsListResponse(BaseModel):
    """사용자 가격 알림 목록."""

    alerts: list[PriceAlertResponse]
    total: int


class AlertCheckResult(BaseModel):
    """가격 알림 체크 결과 요약."""

    checked_count: int
    triggered_count: int
    notified_count: int
    failed_tickers: list[str]
    checked_at: datetime


class RiskAlertResult(BaseModel):
    """리스크 조건 체크 결과."""

    vix_alert: bool = False
    vix_value: float | None = None
    geopolitical_alert: bool = False
    high_urgency_count: int = 0
    currency_alert: bool = False
    usd_krw_change_pct: float | None = None
    notifications_sent: int = 0
    checked_at: datetime
