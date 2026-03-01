"""텔레그램 봇 — 메시지 발송 + 양방향 명령어 핸들러."""

from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

from app.config import settings
from app.dependencies import get_supabase
from app.utils.logger import get_logger

logger = get_logger(__name__)

# ─── 모듈 수준 상태 ───

_bot_app: Application | None = None


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# (A) 메시지 발송 유틸
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


async def _send_message_async(
    chat_id: str,
    text: str,
    parse_mode: str = "HTML",
) -> bool:
    """비동기 텔레그램 메시지 발송."""
    if not settings.telegram_bot_token:
        logger.warning("Telegram bot token not configured, skipping send")
        return False
    try:
        from telegram import Bot

        bot = Bot(token=settings.telegram_bot_token)
        async with bot:
            await bot.send_message(
                chat_id=chat_id,
                text=text,
                parse_mode=parse_mode,
            )
        return True
    except Exception as e:
        logger.error("Telegram send failed to %s: %s", chat_id, e)
        return False


def send_message(chat_id: str, text: str) -> bool:
    """동기 래퍼 — 스케줄러 잡에서 호출한다."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        with ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(asyncio.run, _send_message_async(chat_id, text))
            return future.result(timeout=30)
    else:
        return asyncio.run(_send_message_async(chat_id, text))


def send_to_default(text: str) -> bool:
    """config의 기본 chat_id로 발송한다."""
    if not settings.telegram_chat_id:
        logger.warning("Default telegram_chat_id not configured")
        return False
    return send_message(settings.telegram_chat_id, text)


async def send_to_user_async(user_id: str, text: str) -> bool:
    """notification_targets에서 사용자 telegram_chat_id를 조회 후 발송한다."""
    try:
        client = get_supabase()
        result = (
            client.table("notification_targets")
            .select("telegram_chat_id")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if result.data and result.data[0].get("telegram_chat_id"):
            chat_id = result.data[0]["telegram_chat_id"]
            return await _send_message_async(chat_id, text)
        # fallback: 기본 chat_id로 발송
        if settings.telegram_chat_id:
            return await _send_message_async(settings.telegram_chat_id, text)
        return False
    except Exception as e:
        logger.error("send_to_user_async failed for %s: %s", user_id, e)
        return False


def send_to_user_sync(user_id: str, text: str) -> bool:
    """send_to_user_async의 동기 래퍼 — sync 컨텍스트에서 호출한다."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        with ThreadPoolExecutor(max_workers=1) as pool:
            future = pool.submit(asyncio.run, send_to_user_async(user_id, text))
            return future.result(timeout=30)
    else:
        return asyncio.run(send_to_user_async(user_id, text))


def format_auto_registration_summary(
    alerts_created: int,
    watchlist_added: int,
    holdings_count: int,
) -> str:
    """이미지 분석 자동 등록 결과를 HTML 포맷으로 반환한다."""
    lines = ["<b>📸 이미지 분석 자동 등록 완료</b>", ""]
    lines.append(f"분석 종목: <b>{holdings_count}</b>개")

    if alerts_created > 0:
        lines.append(f"🔔 가격 알림 등록: <b>{alerts_created}</b>건")
    if watchlist_added > 0:
        lines.append(f"⭐ 관심종목 등록: <b>{watchlist_added}</b>건")

    if alerts_created == 0 and watchlist_added == 0:
        lines.append("ℹ️ 이미 등록된 항목이므로 추가 등록 없음")

    return "\n".join(lines)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# (B) HTML 메시지 포매터
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def format_price_alert(
    ticker: str,
    company_name: str | None,
    alert_type: str,
    trigger_price: float,
    current_price: float | None,
) -> str:
    """가격 알림 텔레그램 메시지를 HTML로 포맷한다."""
    type_label = {
        "TARGET_PRICE": "목표가 도달",
        "STOP_LOSS": "손절가 도달",
        "DAILY_CHANGE": "일일 변동",
    }.get(alert_type, alert_type)

    name = company_name or ticker
    price_str = f"{current_price:,.2f}" if current_price else "N/A"
    trigger_str = f"{trigger_price:,.2f}"

    return (
        f"<b>🔔 가격 알림 발동</b>\n\n"
        f"<b>종목:</b> {name} ({ticker})\n"
        f"<b>유형:</b> {type_label}\n"
        f"<b>설정가:</b> {trigger_str}\n"
        f"<b>현재가:</b> {price_str}\n"
        f"<b>시간:</b> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}"
    )


def format_risk_alert(
    vix: float | None,
    high_urgency_count: int,
    usd_krw_change_pct: float | None,
) -> str:
    """리스크 알림 텔레그램 메시지를 HTML로 포맷한다."""
    lines = ["<b>⚠️ 리스크 알림</b>\n"]

    if vix is not None and vix >= 30:
        lines.append(f"<b>VIX:</b> {vix:.1f} (공포 구간 ≥30)")

    if high_urgency_count > 0:
        lines.append(f"<b>지정학 위험:</b> HIGH 긴급도 {high_urgency_count}건")

    if usd_krw_change_pct is not None and abs(usd_krw_change_pct) >= 2:
        direction = "급등" if usd_krw_change_pct > 0 else "급락"
        lines.append(
            f"<b>환율:</b> USD/KRW {usd_krw_change_pct:+.1f}% ({direction})"
        )

    lines.append(
        f"\n<b>시간:</b> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}"
    )
    return "\n".join(lines)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# (C) 봇 명령어 핸들러
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def _get_user_id_by_chat(chat_id: int) -> str | None:
    """telegram_chat_id → user_id 역조회."""
    try:
        client = get_supabase()
        result = (
            client.table("notification_targets")
            .select("user_id")
            .eq("telegram_chat_id", str(chat_id))
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]["user_id"]
        return None
    except Exception as e:
        logger.error("User lookup by chat_id %s failed: %s", chat_id, e)
        return None


async def _cmd_portfolio(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/portfolio — 포트폴리오 종목 목록 조회."""
    chat_id = update.effective_chat.id
    user_id = _get_user_id_by_chat(chat_id)
    if not user_id:
        await update.message.reply_text("등록되지 않은 사용자입니다.")
        return

    try:
        client = get_supabase()
        result = (
            client.table("portfolio")
            .select("ticker, company_name, quantity, avg_price")
            .eq("user_id", user_id)
            .eq("is_deleted", False)
            .execute()
        )
        rows = result.data or []
        if not rows:
            await update.message.reply_text("포트폴리오가 비어 있습니다.")
            return

        lines = ["<b>📊 내 포트폴리오</b>\n"]
        for r in rows:
            name = r.get("company_name") or r["ticker"]
            qty = r.get("quantity", 0)
            avg = r.get("avg_price", 0)
            lines.append(f"• <b>{name}</b> ({r['ticker']}): {qty}주 @ {avg:,.0f}")

        await update.message.reply_text("\n".join(lines), parse_mode="HTML")
    except Exception as e:
        logger.error("/portfolio command failed: %s", e)
        await update.message.reply_text("포트폴리오 조회 중 오류가 발생했습니다.")


async def _cmd_macro(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/macro — 최신 거시경제 스냅샷 요약."""
    try:
        client = get_supabase()
        from app.services.supabase_client import get_latest

        snap = get_latest(client)
        if not snap:
            await update.message.reply_text("거시 데이터가 없습니다.")
            return

        sd = snap.snapshot_data
        lines = [
            "<b>🌐 거시경제 현황</b>\n",
            f"<b>USD/KRW:</b> {snap.usd_krw:,.1f}" if snap.usd_krw else "",
            f"<b>VIX:</b> {snap.vix:.1f}" if snap.vix else "",
            f"<b>US 10Y:</b> {snap.us_10y_yield:.2f}%"
            if snap.us_10y_yield
            else "",
            f"<b>WTI:</b> ${snap.wti:.1f}" if snap.wti else "",
            f"<b>금:</b> ${snap.gold:.1f}" if snap.gold else "",
        ]

        if sd and sd.global_indices:
            gi = sd.global_indices
            if gi.sp500:
                lines.append(f"<b>S&P500:</b> {gi.sp500:,.1f}")
            if gi.kospi:
                lines.append(f"<b>KOSPI:</b> {gi.kospi:,.1f}")

        lines.append(f"\n<i>수집: {snap.collected_at}</i>")
        text = "\n".join(line for line in lines if line)
        await update.message.reply_text(text, parse_mode="HTML")
    except Exception as e:
        logger.error("/macro command failed: %s", e)
        await update.message.reply_text("거시 데이터 조회 중 오류가 발생했습니다.")


async def _cmd_report(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/report [ticker] — 최신 통합 스코어 리포트."""
    if not context.args:
        await update.message.reply_text("사용법: /report AAPL")
        return

    ticker = context.args[0].upper()

    try:
        client = get_supabase()
        result = (
            client.table("prediction_scores")
            .select("*")
            .eq("ticker", ticker)
            .order("analyzed_at", desc=True)
            .limit(1)
            .execute()
        )
        if not result.data:
            await update.message.reply_text(f"{ticker} 분석 결과가 없습니다.")
            return

        row = result.data[0]
        direction_emoji = {
            "BULLISH": "📈",
            "BEARISH": "📉",
            "NEUTRAL": "➡️",
        }.get(row.get("direction", ""), "")

        risk_emoji = {
            "LOW": "🟢",
            "MEDIUM": "🟡",
            "HIGH": "🔴",
        }.get(row.get("risk_level", ""), "")

        lines = [
            f"<b>📋 {row.get('company_name', ticker)} ({ticker}) 분석 리포트</b>\n",
            f"<b>방향:</b> {direction_emoji} {row.get('direction', 'N/A')}",
            f"<b>리스크:</b> {risk_emoji} {row.get('risk_level', 'N/A')}",
            f"<b>단기 점수:</b> {row.get('short_term_score', 0):.1f}",
            f"<b>중기 점수:</b> {row.get('medium_term_score', 0):.1f}",
            "",
            f"<b>기술:</b> {row.get('technical_score', 0):.1f} | "
            f"<b>거시:</b> {row.get('macro_score', 0):.1f} | "
            f"<b>감성:</b> {row.get('sentiment_score', 0):.1f}",
            f"<b>환율:</b> {row.get('currency_score', 0):.1f} | "
            f"<b>지정학:</b> {row.get('geopolitical_score', 0):.1f}",
        ]

        opinion = row.get("opinion", "")
        if opinion:
            lines.append(f"\n<b>의견:</b> {opinion[:200]}")

        lines.append(f"\n<i>분석: {row.get('analyzed_at', '')}</i>")
        await update.message.reply_text("\n".join(lines), parse_mode="HTML")
    except Exception as e:
        logger.error("/report command failed: %s", e)
        await update.message.reply_text("리포트 조회 중 오류가 발생했습니다.")


async def _cmd_alert(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/alert [ticker] [price] — 목표가 알림 등록."""
    if len(context.args) < 2:
        await update.message.reply_text("사용법: /alert AAPL 200")
        return

    ticker = context.args[0].upper()
    try:
        trigger_price = float(context.args[1])
    except ValueError:
        await update.message.reply_text("가격은 숫자로 입력해 주세요.")
        return

    chat_id = update.effective_chat.id
    user_id = _get_user_id_by_chat(chat_id)
    if not user_id:
        await update.message.reply_text("등록되지 않은 사용자입니다.")
        return

    try:
        client = get_supabase()
        client.table("price_alerts").insert(
            {
                "user_id": user_id,
                "ticker": ticker,
                "alert_type": "TARGET_PRICE",
                "trigger_price": trigger_price,
                "is_triggered": False,
            }
        ).execute()

        await update.message.reply_text(
            f"✅ 알림 등록 완료\n{ticker} 목표가: {trigger_price:,.2f}",
        )
    except Exception as e:
        logger.error("/alert command failed: %s", e)
        await update.message.reply_text("알림 등록 중 오류가 발생했습니다.")


async def _cmd_risk(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/risk — 현재 리스크 현황 요약."""
    try:
        client = get_supabase()
        from app.services.supabase_client import get_latest

        # 거시 스냅샷
        snap = get_latest(client)
        lines = ["<b>🛡️ 리스크 현황</b>\n"]

        if snap:
            vix = snap.vix
            if vix is not None:
                level = "🔴 공포" if vix >= 30 else ("🟡 경계" if vix >= 20 else "🟢 안정")
                lines.append(f"<b>VIX:</b> {vix:.1f} ({level})")

            usd_krw = snap.usd_krw
            if usd_krw is not None:
                lines.append(f"<b>USD/KRW:</b> {usd_krw:,.1f}")
        else:
            lines.append("거시 데이터 없음")

        # 종목별 리스크 레벨
        result = (
            client.table("prediction_scores")
            .select("ticker, company_name, risk_level, direction")
            .order("analyzed_at", desc=True)
            .limit(20)
            .execute()
        )

        if result.data:
            # 종목당 최신 1건만 (중복 제거)
            seen: set[str] = set()
            lines.append("\n<b>종목별 리스크:</b>")
            for row in result.data:
                t = row["ticker"]
                if t in seen:
                    continue
                seen.add(t)
                risk_emoji = {"LOW": "🟢", "MEDIUM": "🟡", "HIGH": "🔴"}.get(
                    row.get("risk_level", ""), ""
                )
                name = row.get("company_name") or t
                lines.append(f"  {risk_emoji} {name} — {row.get('risk_level', 'N/A')}")

        await update.message.reply_text("\n".join(lines), parse_mode="HTML")
    except Exception as e:
        logger.error("/risk command failed: %s", e)
        await update.message.reply_text("리스크 조회 중 오류가 발생했습니다.")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# (D) 봇 생명주기
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


def build_bot_application() -> Application | None:
    """텔레그램 봇 Application을 빌드하고 핸들러를 등록한다."""
    global _bot_app

    if not settings.telegram_bot_token:
        logger.info("Telegram bot token not set, bot disabled")
        return None

    _bot_app = (
        Application.builder()
        .token(settings.telegram_bot_token)
        .build()
    )

    _bot_app.add_handler(CommandHandler("portfolio", _cmd_portfolio))
    _bot_app.add_handler(CommandHandler("macro", _cmd_macro))
    _bot_app.add_handler(CommandHandler("report", _cmd_report))
    _bot_app.add_handler(CommandHandler("alert", _cmd_alert))
    _bot_app.add_handler(CommandHandler("risk", _cmd_risk))

    logger.info("Telegram bot application built with 5 command handlers")
    return _bot_app


async def start_bot():
    """봇 폴링을 시작한다."""
    global _bot_app
    if _bot_app is None:
        logger.warning("Bot application not built, cannot start")
        return

    await _bot_app.initialize()
    await _bot_app.start()
    if _bot_app.updater:
        await _bot_app.updater.start_polling(drop_pending_updates=True)
    logger.info("Telegram bot polling started")


async def stop_bot():
    """봇을 안전하게 종료한다."""
    global _bot_app
    if _bot_app is None:
        return

    try:
        if _bot_app.updater and _bot_app.updater.running:
            await _bot_app.updater.stop()
        if _bot_app.running:
            await _bot_app.stop()
        await _bot_app.shutdown()
        logger.info("Telegram bot stopped")
    except Exception as e:
        logger.error("Error stopping telegram bot: %s", e)
    finally:
        _bot_app = None
