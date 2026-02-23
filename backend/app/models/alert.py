"""알림 시스템 Pydantic 모델."""

from datetime import datetime

from pydantic import BaseModel


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
