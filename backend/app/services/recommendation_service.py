"""추천 엔진 서비스 — 기술적 스크리닝 + AI 추천 근거 생성."""

import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta, timezone

import httpx
import yfinance as yf
from supabase import Client

from app.config import settings
from app.models.recommendation import (
    RecommendationResponse,
    ScreeningDetail,
    ScreenResponse,
)
from app.services import stock_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_SCREENING_MODEL = "deepseek/deepseek-chat-v3-0324"
MAX_WORKERS = 8


# ═══════════════════════════════════════════════════════════
# (A) 스크리닝 점수 계산
# ═══════════════════════════════════════════════════════════


def _calc_screening_score(ticker: str) -> ScreeningDetail:
    """개별 종목의 스크리닝 점수를 계산한다 (0~100)."""
    score = 0
    rsi_val: float | None = None
    macd_signal = ""
    bb_signal = ""
    sma_signal = ""
    per_val: float | None = None
    name = ""

    # 기술적 지표 조회
    try:
        indicator_resp = stock_service.fetch_indicators(ticker)
        ind = indicator_resp.indicators

        # RSI
        if ind.rsi.value is not None:
            rsi_val = ind.rsi.value
            if rsi_val <= 30:
                score += 30
            elif rsi_val <= 40:
                score += 15

        # MACD
        macd_signal = ind.macd.signal or ""
        if "골든크로스" in macd_signal:
            score += 25

        # BB
        bb_signal = ind.bollinger_bands.signal or ""
        if "하단" in bb_signal:
            score += 20

        # SMA 정배열
        sma_signal = ind.sma.signal or ""
        if "정배열" in sma_signal:
            score += 10

    except Exception as e:
        logger.warning("Indicator fetch failed for %s: %s", ticker, e)
        return ScreeningDetail(ticker=ticker, name=name)

    # PER 조회 (yfinance info)
    try:
        t = yf.Ticker(ticker)
        info = stock_service._retry_yf_call(lambda: t.info)
        per_val = info.get("trailingPE")
        name = info.get("shortName", "") or info.get("longName", "")
        if per_val is not None:
            if per_val <= 15:
                score += 15
            elif per_val <= 25:
                score += 5
    except Exception as e:
        logger.warning("PER fetch failed for %s: %s", ticker, e)

    return ScreeningDetail(
        ticker=ticker,
        name=name,
        rsi=rsi_val,
        macd_signal=macd_signal,
        bb_signal=bb_signal,
        per=round(per_val, 2) if per_val is not None else None,
        sma_signal=sma_signal,
        composite_score=score,
        passed=False,  # threshold 비교는 호출자에서 수행
    )


# ═══════════════════════════════════════════════════════════
# (B) AI 추천 근거 생성
# ═══════════════════════════════════════════════════════════


def _get_screening_model(client: Client) -> str:
    """model_configs에서 SCREENING_BULK 모델을 조회한다."""
    try:
        result = (
            client.table("model_configs")
            .select("primary_model")
            .eq("config_key", "SCREENING_BULK")
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]["primary_model"]
    except Exception as e:
        logger.warning(
            "Failed to query model_configs for SCREENING_BULK: %s — using default",
            e,
        )
    return DEFAULT_SCREENING_MODEL


def _fetch_market_causal_chain(client: Client) -> str:
    """오늘의 daily_briefings에서 market_causal_chain을 가져온다."""
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    try:
        res = (
            client.table("daily_briefings")
            .select("market_causal_chain")
            .eq("briefing_date", today_str)
            .limit(1)
            .execute()
        )
        if res.data and res.data[0].get("market_causal_chain"):
            chain = res.data[0]["market_causal_chain"]
            lines = []
            for i, step in enumerate(chain, 1):
                lines.append(
                    f"  {i}. [{step.get('direction', '')}] "
                    f"{step.get('event', '')} → {step.get('impact', '')}"
                )
                if step.get("reasoning"):
                    lines.append(f"     근거: {step['reasoning']}")
            return "\n".join(lines)
    except Exception as e:
        logger.warning("Failed to fetch market causal chain: %s", e)
    return ""


def _generate_recommendation_reason(
    ticker: str,
    detail: ScreeningDetail,
    current_price: float | None,
    client: Client,
) -> dict:
    """OpenRouter API로 추천 근거, 목표가, 손절가, 전략을 생성한다."""

    # API 미설정 시 룰 기반 fallback
    if not settings.openrouter_api_key or current_price is None:
        return _make_rule_based_reason(ticker, detail, current_price)

    model = _get_screening_model(client)
    logger.info(
        "Generating recommendation reason for %s with model: %s", ticker, model
    )

    # 오늘의 거시경제 인과관계 체인 로드
    causal_context = _fetch_market_causal_chain(client)
    macro_section = ""
    if causal_context:
        macro_section = f"""
## 오늘의 거시경제 인과관계 (투자 가이드에서 도출)
{causal_context}
"""

    prompt = f"""당신은 독립적 주식 분석가입니다. 뉴스·증권사 리포트를 요약하지 마세요.
아래 기술적 스크리닝 결과와 거시경제 인과관계를 종합하여 이 종목의 추천 근거를 작성하세요.

## 종목 정보
- 티커: {ticker}
- 종목명: {detail.name}
- 현재가: {current_price}

## 스크리닝 결과 (점수: {detail.composite_score}/100)
- RSI: {detail.rsi}
- MACD: {detail.macd_signal}
- 볼린저밴드: {detail.bb_signal}
- SMA: {detail.sma_signal}
- PER: {detail.per}
{macro_section}
## 핵심 원칙
1. 기술적 지표 + 거시경제 인과관계를 **연결**하여 추천 근거를 작성하세요.
2. "왜 지금 이 종목인가?"를 거시경제 흐름에서 출발하여 설명하세요.
3. 단순 수치 나열 금지 — 인과관계를 서사적으로 연결하세요.

## 응답 형식 (JSON만 반환)
{{
  "reason": "3-5문장 — 거시경제 인과관계에서 출발하여 이 종목이 왜 추천되는지 서사적으로 설명 (한국어)",
  "target_price": 목표가(숫자),
  "stop_loss": 손절가(숫자),
  "strategy": "SWING" | "POSITION" | "SCALPING",
  "confidence_score": 0.0~1.0 사이의 신뢰도
}}

JSON만 반환하세요."""

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
            timeout=60.0,
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

    except Exception as e:
        logger.error("AI recommendation reason failed for %s: %s", ticker, e)
        return _make_rule_based_reason(ticker, detail, current_price)


def _make_rule_based_reason(
    ticker: str,
    detail: ScreeningDetail,
    current_price: float | None,
) -> dict:
    """AI 실패 시 룰 기반 fallback 추천 근거를 생성한다."""
    reasons = []
    if detail.rsi is not None and detail.rsi <= 30:
        reasons.append(f"RSI {detail.rsi:.1f}로 과매도 구간 진입")
    if "골든크로스" in detail.macd_signal:
        reasons.append("MACD 골든크로스 발생")
    if "하단" in detail.bb_signal:
        reasons.append("볼린저밴드 하단 이탈")
    if "정배열" in detail.sma_signal:
        reasons.append("SMA 정배열 (상승 추세)")
    if detail.per is not None and detail.per <= 15:
        reasons.append(f"PER {detail.per:.1f}로 저평가 구간")

    reason = (
        f"{ticker}({detail.name})은 "
        + ", ".join(reasons if reasons else ["기술적 조건 충족"])
        + " 상태로 매수 검토 가능합니다."
    )

    price = current_price or 0
    return {
        "reason": reason,
        "target_price": round(price * 1.15, 2) if price else None,
        "stop_loss": round(price * 0.85, 2) if price else None,
        "strategy": "SWING",
        "confidence_score": round(detail.composite_score / 100, 2),
    }


# ═══════════════════════════════════════════════════════════
# (C) 메인 스크리닝 함수
# ═══════════════════════════════════════════════════════════


def screen_tickers(
    tickers: list[str],
    threshold: int,
    client: Client,
) -> ScreenResponse:
    """티커 목록을 스크리닝하고 임계값 이상 종목의 추천을 생성한다."""

    # 1. 병렬 스크리닝 점수 계산
    details: list[ScreeningDetail] = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_map = {
            executor.submit(_calc_screening_score, t.strip().upper()): t
            for t in tickers
        }
        for future in as_completed(future_map):
            raw_ticker = future_map[future]
            try:
                details.append(future.result())
            except Exception as e:
                logger.error(
                    "Screening failed for %s: %s", raw_ticker, e
                )
                details.append(
                    ScreeningDetail(ticker=raw_ticker.strip().upper())
                )

    # 2. threshold 필터링
    passed: list[ScreeningDetail] = []
    for d in details:
        if d.composite_score >= threshold:
            d.passed = True
            passed.append(d)

    # 3. 통과 종목 → AI 추천 근거 생성 + DB INSERT
    recommendations_created = 0
    for detail in passed:
        try:
            # 현재가 조회
            quote = stock_service.fetch_quote(detail.ticker)
            current_price = quote.price

            # AI 추천 근거
            ai_result = _generate_recommendation_reason(
                detail.ticker, detail, current_price, client
            )

            # recommendations 테이블 INSERT
            now = datetime.now(timezone.utc)
            row = {
                "ticker": detail.ticker,
                "company_name": detail.name or None,
                "market": None,
                "reason": ai_result.get("reason"),
                "target_price": ai_result.get("target_price"),
                "stop_loss": ai_result.get("stop_loss"),
                "confidence_score": ai_result.get("confidence_score"),
                "strategy": ai_result.get("strategy"),
                "is_active": True,
                "expires_at": (now + timedelta(days=30)).isoformat(),
                "created_at": now.isoformat(),
            }

            client.table("recommendations").insert(row).execute()
            recommendations_created += 1
            logger.info("Recommendation created for %s", detail.ticker)

        except Exception as e:
            logger.error(
                "Recommendation creation failed for %s: %s",
                detail.ticker,
                e,
            )

    return ScreenResponse(
        screened=details,
        recommendations_created=recommendations_created,
        total_screened=len(details),
    )


# ═══════════════════════════════════════════════════════════
# (D) 활성 추천 조회
# ═══════════════════════════════════════════════════════════


def get_active_recommendations(
    client: Client,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[RecommendationResponse], int]:
    """활성 추천 목록을 페이지네이션으로 반환한다."""
    count_result = (
        client.table("recommendations")
        .select("id", count="exact")
        .eq("is_active", True)
        .execute()
    )
    total = count_result.count or 0

    result = (
        client.table("recommendations")
        .select("*")
        .eq("is_active", True)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    recommendations = [_row_to_response(row) for row in result.data]
    return recommendations, total


# ═══════════════════════════════════════════════════════════
# (E) 만료 추천 비활성화
# ═══════════════════════════════════════════════════════════


def deactivate_expired(client: Client) -> int:
    """expires_at이 지난 추천을 비활성화한다."""
    now = datetime.now(timezone.utc).isoformat()

    try:
        result = (
            client.table("recommendations")
            .update({"is_active": False})
            .eq("is_active", True)
            .lt("expires_at", now)
            .execute()
        )
        count = len(result.data) if result.data else 0
        if count > 0:
            logger.info("Deactivated %d expired recommendations", count)
        return count
    except Exception as e:
        logger.error("Failed to deactivate expired recommendations: %s", e)
        return 0


# ─── 헬퍼 ───


def _row_to_response(row: dict) -> RecommendationResponse:
    """DB row를 응답 모델로 변환한다."""
    return RecommendationResponse(
        id=row["id"],
        ticker=row["ticker"],
        company_name=row.get("company_name"),
        market=row.get("market"),
        reason=row.get("reason"),
        target_price=row.get("target_price"),
        stop_loss=row.get("stop_loss"),
        confidence_score=row.get("confidence_score"),
        strategy=row.get("strategy"),
        expires_at=row.get("expires_at"),
        is_active=row.get("is_active", True),
        created_at=row["created_at"],
    )
