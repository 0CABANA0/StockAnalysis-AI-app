"""알림 서비스 — 가격 알림 체크 + 리스크 조건 감지."""

from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from supabase import Client

from app.models.alert import (
    AlertCheckResult,
    PriceAlertResponse,
    PriceAlertsListResponse,
    RiskAlertResult,
)
from app.services import stock_service, telegram_service
from app.services.supabase_client import get_latest
from app.utils.logger import get_logger

logger = get_logger(__name__)

MAX_QUOTE_WORKERS = 8


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# (A) 가격 알림 체크 — FR-E01
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def check_price_alerts(client: Client) -> AlertCheckResult:
    """미발동 가격 알림을 체크하고 조건 충족 시 트리거한다."""
    now = datetime.now(timezone.utc)

    # 1. 미발동 알림 조회
    result = (
        client.table("price_alerts")
        .select("*")
        .eq("is_triggered", False)
        .execute()
    )
    alerts = result.data or []
    checked_count = len(alerts)

    if not alerts:
        return AlertCheckResult(
            checked_count=0,
            triggered_count=0,
            notified_count=0,
            failed_tickers=[],
            checked_at=now,
        )

    # 2. 고유 티커 추출 → 현재가 병렬 조회
    unique_tickers = list({a["ticker"] for a in alerts})
    prices: dict[str, float | None] = {}
    failed_tickers: list[str] = []

    with ThreadPoolExecutor(max_workers=MAX_QUOTE_WORKERS) as executor:
        future_map = {
            executor.submit(stock_service.fetch_quote, t): t
            for t in unique_tickers
        }
        for future in future_map:
            ticker = future_map[future]
            try:
                quote = future.result(timeout=30)
                prices[ticker] = quote.price
            except Exception as e:
                logger.error("Quote fetch failed for %s: %s", ticker, e)
                prices[ticker] = None
                failed_tickers.append(ticker)

    # 3. 조건 판정 + 트리거
    triggered_count = 0
    notified_count = 0

    for alert in alerts:
        ticker = alert["ticker"]
        current_price = prices.get(ticker)
        if current_price is None:
            continue

        alert_type = alert["alert_type"]
        trigger_price = float(alert["trigger_price"])
        triggered = False

        if alert_type == "TARGET_PRICE" and current_price >= trigger_price:
            triggered = True
        elif alert_type == "STOP_LOSS" and current_price <= trigger_price:
            triggered = True
        # DAILY_CHANGE: Phase 1 미구현

        if not triggered:
            continue

        triggered_count += 1

        # 4. DB 업데이트
        try:
            client.table("price_alerts").update(
                {
                    "is_triggered": True,
                    "triggered_at": now.isoformat(),
                    "current_price": current_price,
                }
            ).eq("id", alert["id"]).execute()
        except Exception as e:
            logger.error("Failed to update alert %s: %s", alert["id"], e)
            continue

        # 5. 텔레그램 알림 발송
        msg = telegram_service.format_price_alert(
            ticker=ticker,
            company_name=alert.get("company_name"),
            alert_type=alert_type,
            trigger_price=trigger_price,
            current_price=current_price,
        )
        try:
            sent = asyncio.run(
                telegram_service.send_to_user_async(alert["user_id"], msg)
            )
        except RuntimeError:
            # 이미 이벤트 루프가 실행 중인 경우
            sent = telegram_service.send_to_default(msg)

        if sent:
            notified_count += 1

    logger.info(
        "Price alert check: checked=%d, triggered=%d, notified=%d, failed=%s",
        checked_count,
        triggered_count,
        notified_count,
        failed_tickers,
    )

    return AlertCheckResult(
        checked_count=checked_count,
        triggered_count=triggered_count,
        notified_count=notified_count,
        failed_tickers=failed_tickers,
        checked_at=now,
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# (B) 리스크 조건 체크 — FR-E02
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def check_risk_conditions(client: Client) -> RiskAlertResult:
    """리스크 조건(VIX/환율/지정학)을 체크하고 알림을 발송한다."""
    now = datetime.now(timezone.utc)

    vix_alert = False
    vix_value: float | None = None
    currency_alert = False
    usd_krw_change_pct: float | None = None
    geopolitical_alert = False
    high_urgency_count = 0

    # 1. VIX 체크 — 최신 스냅샷에서
    latest = get_latest(client)
    if latest and latest.vix is not None:
        vix_value = latest.vix
        if vix_value >= 30:
            vix_alert = True

    # 2. 환율 변동 체크 — 직전 스냅샷 대비
    if latest and latest.usd_krw is not None:
        try:
            history = (
                client.table("macro_snapshots")
                .select("usd_krw")
                .order("collected_at", desc=True)
                .limit(2)
                .execute()
            )
            rows = history.data or []
            if len(rows) >= 2 and rows[1].get("usd_krw"):
                prev_usd_krw = float(rows[1]["usd_krw"])
                curr_usd_krw = float(latest.usd_krw)
                if prev_usd_krw > 0:
                    usd_krw_change_pct = round(
                        ((curr_usd_krw - prev_usd_krw) / prev_usd_krw) * 100, 2
                    )
                    if abs(usd_krw_change_pct) >= 2:
                        currency_alert = True
        except Exception as e:
            logger.error("Currency change check failed: %s", e)

    # 3. 지정학 리스크 — sentiment_results에서 HIGH urgency GEOPOLITICAL 조회
    try:
        geo_result = (
            client.table("sentiment_results")
            .select("id")
            .eq("event_type", "GEOPOLITICAL")
            .eq("urgency", "HIGH")
            .order("analyzed_at", desc=True)
            .limit(10)
            .execute()
        )
        high_urgency_count = len(geo_result.data or [])
        if high_urgency_count > 0:
            geopolitical_alert = True
    except Exception as e:
        logger.error("Geopolitical risk check failed: %s", e)

    # 4. 조건 충족 시 알림 브로드캐스트
    notifications_sent = 0
    if vix_alert or currency_alert or geopolitical_alert:
        msg = telegram_service.format_risk_alert(
            vix=vix_value,
            high_urgency_count=high_urgency_count,
            usd_krw_change_pct=usd_krw_change_pct,
        )

        # 모든 활성 notification_targets에 발송
        try:
            targets = (
                client.table("notification_targets")
                .select("telegram_chat_id")
                .eq("is_active", True)
                .execute()
            )
            for target in targets.data or []:
                chat_id = target.get("telegram_chat_id")
                if chat_id:
                    ok = telegram_service.send_message(chat_id, msg)
                    if ok:
                        notifications_sent += 1
        except Exception as e:
            logger.error("Risk alert broadcast failed: %s", e)

        # fallback: 기본 chat_id로도 발송
        if notifications_sent == 0:
            if telegram_service.send_to_default(msg):
                notifications_sent = 1

    logger.info(
        "Risk check: vix=%s(%.1f), geo=%s(%d), currency=%s(%.2f%%), sent=%d",
        vix_alert,
        vix_value or 0,
        geopolitical_alert,
        high_urgency_count,
        currency_alert,
        usd_krw_change_pct or 0,
        notifications_sent,
    )

    return RiskAlertResult(
        vix_alert=vix_alert,
        vix_value=vix_value,
        geopolitical_alert=geopolitical_alert,
        high_urgency_count=high_urgency_count,
        currency_alert=currency_alert,
        usd_krw_change_pct=usd_krw_change_pct,
        notifications_sent=notifications_sent,
        checked_at=now,
    )


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# (C) 사용자 알림 조회 — 라우터용
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def get_user_alerts(client: Client, user_id: str) -> PriceAlertsListResponse:
    """사용자의 가격 알림 목록을 반환한다."""
    result = (
        client.table("price_alerts")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    rows = result.data or []

    alerts = [
        PriceAlertResponse(
            id=r["id"],
            user_id=r["user_id"],
            ticker=r["ticker"],
            company_name=r.get("company_name"),
            alert_type=r["alert_type"],
            trigger_price=float(r["trigger_price"]),
            current_price=float(r["current_price"]) if r.get("current_price") else None,
            is_triggered=r.get("is_triggered", False),
            triggered_at=r.get("triggered_at"),
            memo=r.get("memo"),
            created_at=r["created_at"],
        )
        for r in rows
    ]

    return PriceAlertsListResponse(alerts=alerts, total=len(alerts))
