"""이미지 분석 서비스 — Vision OCR + 종목 검증 + AI 투자 가이드 (모듈 G)."""

import base64
import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

import httpx
import yfinance as yf
from supabase import Client

from app.config import settings
from app.models.image import (
    ActionPlan,
    HoldingRecommendation,
    ImageAnalysisResponse,
    InvestmentGuide,
    RecognizedHolding,
    SectorAnalysis,
)
from app.services.alert_service import create_alerts_from_holdings
from app.services.supabase_client import get_latest
from app.services.telegram_service import (
    format_auto_registration_summary,
    send_to_user_sync,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_VISION_MODEL = "anthropic/claude-sonnet-4-20250514"
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10MB
MAX_WORKERS = 8


# ═══════════════════════════════════════════════════════════
# (A) Vision 모델 조회
# ═══════════════════════════════════════════════════════════


def _get_vision_model(client: Client) -> str:
    """model_configs 테이블에서 IMAGE_ANALYSIS 모델을 조회한다."""
    try:
        result = (
            client.table("model_configs")
            .select("primary_model")
            .eq("config_key", "IMAGE_ANALYSIS")
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]["primary_model"]
    except Exception as e:
        logger.warning(
            "Failed to query model_configs for IMAGE_ANALYSIS: %s — using default", e
        )

    return DEFAULT_VISION_MODEL


# ═══════════════════════════════════════════════════════════
# (B) Vision OCR — 이미지에서 종목 정보 추출
# ═══════════════════════════════════════════════════════════


def _extract_holdings_from_image(
    image_base64: str, media_type: str, model: str
) -> list[dict]:
    """OpenRouter Vision API로 증권사 스크린샷에서 종목 정보를 추출한다."""
    prompt = """당신은 증권사 포트폴리오 스크린샷 분석 전문가입니다.
이미지에서 보유 종목 정보를 추출하여 JSON 배열로 반환하세요.

## 보안 규칙 (필수)
- 계좌번호, 이름, 주민번호, 전화번호 등 개인 식별 정보는 절대 추출하지 마세요.
- 개인정보가 보이면 "***" 으로 마스킹하세요.

## 추출 항목
각 종목에 대해 다음 필드를 추출하세요:
- ticker: 종목코드 (6자리 숫자면 .KS 또는 .KQ 붙이기, 미국 종목은 그대로)
- name: 종목명
- quantity: 보유수량 (숫자)
- avg_price: 평균매입가 (숫자)
- current_price: 현재가 (숫자)
- profit_loss_rate: 수익률 (%, 소수점)
- confidence: 추출 확신도 (0.0~1.0)

## 응답 형식
JSON 배열만 반환하세요. 다른 텍스트는 포함하지 마세요.
[
  {"ticker": "005930.KS", "name": "삼성전자", "quantity": 100, "avg_price": 70000, "current_price": 72000, "profit_loss_rate": 2.86, "confidence": 0.95},
  ...
]"""

    response = httpx.post(
        OPENROUTER_URL,
        headers={
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{media_type};base64,{image_base64}"
                            },
                        },
                        {"type": "text", "text": prompt},
                    ],
                }
            ],
            "temperature": 0.1,
        },
        timeout=120.0,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]

    # JSON 파싱 — 코드 블록 제거
    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1] if "\n" in content else content
        if content.endswith("```"):
            content = content[: -len("```")]
        content = content.strip()

    return json.loads(content)


# ═══════════════════════════════════════════════════════════
# (C) yfinance 종목 검증
# ═══════════════════════════════════════════════════════════


def _verify_single_ticker(holding: dict) -> RecognizedHolding:
    """단일 종목을 yfinance로 검증한다."""
    ticker = holding.get("ticker")
    rec = RecognizedHolding(
        ticker=ticker,
        name=holding.get("name", ""),
        quantity=holding.get("quantity"),
        avg_price=holding.get("avg_price"),
        current_price=holding.get("current_price"),
        profit_loss_rate=holding.get("profit_loss_rate"),
        confidence=holding.get("confidence", 0.0),
        verified=False,
    )

    if not ticker:
        return rec

    try:
        info = yf.Ticker(ticker).fast_info
        if hasattr(info, "last_price") and info.last_price is not None:
            rec.current_price = round(float(info.last_price), 2)
            rec.verified = True
        else:
            logger.warning("Ticker %s: no price data from yfinance", ticker)
    except Exception as e:
        logger.warning("Ticker verification failed for %s: %s", ticker, e)

    return rec


def _verify_tickers(holdings: list[dict]) -> list[RecognizedHolding]:
    """yfinance로 종목 코드 유효성을 병렬 검증한다."""
    if not holdings:
        return []

    results: list[RecognizedHolding] = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(_verify_single_ticker, h): i
            for i, h in enumerate(holdings)
        }
        indexed: dict[int, RecognizedHolding] = {}
        for future in as_completed(futures):
            idx = futures[future]
            try:
                indexed[idx] = future.result()
            except Exception as e:
                logger.error("Verification error at index %d: %s", idx, e)
                h = holdings[idx]
                indexed[idx] = RecognizedHolding(
                    ticker=h.get("ticker"),
                    name=h.get("name", ""),
                    confidence=h.get("confidence", 0.0),
                )

    # 원래 순서 유지
    for i in range(len(holdings)):
        results.append(indexed[i])

    verified_count = sum(1 for r in results if r.verified)
    logger.info(
        "Ticker verification: %d/%d verified", verified_count, len(results)
    )
    return results


# ═══════════════════════════════════════════════════════════
# (D) AI 투자 가이드 생성
# ═══════════════════════════════════════════════════════════


def _generate_investment_guide(
    holdings: list[RecognizedHolding], client: Client
) -> InvestmentGuide | None:
    """검증된 종목 목록으로 AI 투자 가이드를 생성한다."""
    if not settings.openrouter_api_key:
        logger.warning("OPENROUTER_API_KEY not set — skipping investment guide")
        return None

    if not holdings:
        return None

    model = _get_vision_model(client)

    # 거시 스냅샷 조회
    snapshot = get_latest(client)
    macro_context = ""
    if snapshot:
        macro_context = f"""
## 최신 거시경제 데이터
- VIX: {snapshot.vix}
- USD/KRW: {snapshot.usd_krw}
- US 10Y 금리: {snapshot.us_10y_yield}
- WTI: {snapshot.wti}
- 금: {snapshot.gold}
"""

    # 종목 목록 텍스트
    holdings_text = ""
    total_value = 0.0
    for h in holdings:
        val = (h.current_price or 0) * (h.quantity or 0)
        total_value += val
        holdings_text += (
            f"- {h.name} ({h.ticker}): "
            f"수량 {h.quantity}, 평균가 {h.avg_price}, "
            f"현재가 {h.current_price}, 수익률 {h.profit_loss_rate}%, "
            f"검증 {'O' if h.verified else 'X'}\n"
        )

    prompt = f"""당신은 전문 투자 자문가입니다. 다음 포트폴리오를 분석하고 투자 가이드를 작성하세요.

## 보유 종목
{holdings_text}
{macro_context}

## 응답 형식 (JSON만 반환)
{{
  "diagnosis": "포트폴리오 전체 진단 (3-5문장)",
  "sector_analysis": [
    {{"name": "섹터명", "weight_pct": 비중(%), "assessment": "평가"}}
  ],
  "recommendations": [
    {{
      "ticker": "종목코드",
      "name": "종목명",
      "opinion": "STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL",
      "rationale": "근거 (1-2문장)",
      "target_price": 목표가(숫자 또는 null),
      "stop_loss": 손절가(숫자 또는 null)
    }}
  ],
  "risk_level": "LOW|MEDIUM|HIGH",
  "action_plan": {{
    "this_week": ["이번 주 할 일"],
    "this_month": ["이번 달 할 일"],
    "three_months": ["3개월 내 할 일"]
  }}
}}

JSON만 반환하세요. 다른 텍스트는 포함하지 마세요.
면책: 이 분석은 투자 참고용이며 실제 투자 판단의 책임은 본인에게 있습니다."""

    try:
        response = httpx.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
            },
            timeout=120.0,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]

        # JSON 파싱 — 코드 블록 제거
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content
            if content.endswith("```"):
                content = content[: -len("```")]
            content = content.strip()

        data = json.loads(content)

        return InvestmentGuide(
            diagnosis=data.get("diagnosis", ""),
            sector_analysis=[
                SectorAnalysis(**s) for s in data.get("sector_analysis", [])
            ],
            recommendations=[
                HoldingRecommendation(**r)
                for r in data.get("recommendations", [])
            ],
            risk_level=data.get("risk_level", "MEDIUM"),
            action_plan=ActionPlan(**data.get("action_plan", {})),
        )

    except Exception as e:
        logger.error("Investment guide generation failed: %s", e)
        return None


# ═══════════════════════════════════════════════════════════
# (E) 분석 로그 기록
# ═══════════════════════════════════════════════════════════


def _log_analysis(
    client: Client,
    user_id: str,
    success: bool,
    holdings_count: int,
    error: str | None = None,
) -> None:
    """image_analysis_logs 테이블에 처리 로그를 기록한다. (이미지 원본 미저장)"""
    row = {
        "user_id": user_id,
        "success": success,
        "holdings_count": holdings_count,
        "error_message": error,
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        client.table("image_analysis_logs").insert(row).execute()
    except Exception as e:
        # 테이블이 없어도 graceful skip
        logger.warning("Failed to log image analysis (table may not exist): %s", e)


# ═══════════════════════════════════════════════════════════
# (F) 메인 진입점
# ═══════════════════════════════════════════════════════════


def _derive_market(ticker: str) -> str:
    """티커 접미사로 시장을 판별한다."""
    if ticker.endswith(".KS") or ticker.endswith(".KQ"):
        return "KR"
    return "US"


def _auto_register_watchlist(
    client: Client,
    user_id: str,
    holdings: list[RecognizedHolding],
) -> int:
    """OCR 추출 종목을 관심종목에 자동 등록한다. 중복은 건너뛴다."""
    # 기존 관심종목 조회
    existing = (
        client.table("watchlist")
        .select("ticker")
        .eq("user_id", user_id)
        .execute()
    )
    existing_tickers = {r["ticker"] for r in (existing.data or [])}

    added = 0
    for h in holdings:
        if not h.ticker or h.ticker in existing_tickers:
            continue
        try:
            client.table("watchlist").insert({
                "user_id": user_id,
                "ticker": h.ticker,
                "company_name": h.name,
                "market": _derive_market(h.ticker),
                "asset_type": "STOCK",
            }).execute()
            existing_tickers.add(h.ticker)
            added += 1
        except Exception as e:
            logger.warning("Auto watchlist failed for %s: %s", h.ticker, e)

    if added:
        logger.info("Auto-added %d tickers to watchlist for user %s", added, user_id)
    return added


def analyze_image(
    image_data: str,
    media_type: str,
    client: Client,
    user_id: str,
    auto_register_alerts: bool = False,
    auto_register_watchlist: bool = False,
) -> ImageAnalysisResponse:
    """이미지 OCR → 종목 검증 → AI 투자 가이드 파이프라인을 실행한다."""
    start_ms = int(time.time() * 1000)

    # 1. 이미지 크기 검증
    try:
        decoded = base64.b64decode(image_data)
        image_size = len(decoded)
        del decoded  # 메모리 즉시 해제
    except Exception:
        _log_analysis(client, user_id, False, 0, "Invalid base64 data")
        raise ValueError("유효하지 않은 base64 이미지 데이터입니다.")

    if image_size > MAX_IMAGE_BYTES:
        _log_analysis(client, user_id, False, 0, "Image too large")
        raise ValueError(
            f"이미지 크기가 {MAX_IMAGE_BYTES // (1024 * 1024)}MB를 초과합니다."
        )

    # 2. Vision OCR 추출
    if not settings.openrouter_api_key:
        _log_analysis(client, user_id, False, 0, "OPENROUTER_API_KEY not set")
        raise ValueError("OpenRouter API 키가 설정되지 않았습니다.")

    model = _get_vision_model(client)
    logger.info("Image analysis started (model: %s, size: %d bytes)", model, image_size)

    try:
        raw_holdings = _extract_holdings_from_image(image_data, media_type, model)
    except Exception as e:
        logger.error("Vision OCR failed: %s", e)
        _log_analysis(client, user_id, False, 0, f"OCR failed: {e}")
        raise ValueError(f"이미지 분석에 실패했습니다: {e}")

    # 3. yfinance 검증
    holdings = _verify_tickers(raw_holdings)

    # 4. AI 투자 가이드 생성
    guide = _generate_investment_guide(holdings, client)

    # 5. 자동 등록 (가격 알림 + 관심종목)
    alerts_created = 0
    watchlist_added = 0

    if auto_register_alerts and guide and guide.recommendations:
        try:
            alerts_created = create_alerts_from_holdings(
                client, user_id, guide.recommendations,
            )
        except Exception as e:
            logger.error("Auto alert registration failed: %s", e)

    if auto_register_watchlist and holdings:
        try:
            watchlist_added = _auto_register_watchlist(client, user_id, holdings)
        except Exception as e:
            logger.error("Auto watchlist registration failed: %s", e)

    # 5-1. 텔레그램 알림 (등록된 항목이 있을 때만)
    if alerts_created > 0 or watchlist_added > 0:
        try:
            msg = format_auto_registration_summary(
                alerts_created, watchlist_added, len(holdings),
            )
            send_to_user_sync(user_id, msg)
        except Exception as e:
            logger.warning("Telegram auto-reg notification failed: %s", e)

    # 6. 로그 기록
    _log_analysis(client, user_id, True, len(holdings))

    # 7. 이미지 데이터 참조 해제 (호출자의 변수는 별도)
    del image_data

    # 8. 결과 반환
    elapsed_ms = int(time.time() * 1000) - start_ms
    verified_count = sum(1 for h in holdings if h.verified)

    if not holdings:
        status = "FAILED"
    elif verified_count == len(holdings):
        status = "SUCCESS"
    else:
        status = "PARTIAL"

    logger.info(
        "Image analysis completed: %d holdings, %d verified, "
        "%d alerts, %d watchlist, %dms",
        len(holdings),
        verified_count,
        alerts_created,
        watchlist_added,
        elapsed_ms,
    )

    return ImageAnalysisResponse(
        holdings=holdings,
        investment_guide=guide,
        validation_status=status,
        processing_time_ms=elapsed_ms,
        auto_alerts_created=alerts_created,
        auto_watchlist_added=watchlist_added,
    )
