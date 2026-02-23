"""통합 스코어링 서비스 — 5개 시그널 가중 합산 + AI 리포트 생성."""

import json
from datetime import datetime, timezone

import httpx
from supabase import Client

from app.config import settings
from app.models.prediction import (
    CurrencySignal,
    GeopoliticalSignal,
    MacroSignal,
    PredictionAnalyzeResponse,
    PredictionScoreResponse,
    PredictionScoresListResponse,
    SentimentSignal,
    SignalBreakdown,
    TechnicalSignal,
)
from app.services import sentiment_service, stock_service
from app.services.supabase_client import get_latest
from app.utils.logger import get_logger

logger = get_logger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "claude-sonnet-4-20250514"

# ─── 가중치 ───

WEIGHT_TECHNICAL = 0.30
WEIGHT_MACRO = 0.25
WEIGHT_SENTIMENT = 0.20
WEIGHT_CURRENCY = 0.15
WEIGHT_GEOPOLITICAL = 0.10


# ═══════════════════════════════════════════════════════════
# (a) 5개 시그널 계산
# ═══════════════════════════════════════════════════════════


def _calc_technical_score(ticker: str) -> TechnicalSignal:
    """RSI/MACD/BB 기반 기술적 시그널을 계산한다."""
    try:
        indicator_resp = stock_service.fetch_indicators(ticker)
        ind = indicator_resp.indicators
    except Exception as e:
        logger.warning("Technical indicators failed for %s: %s", ticker, e)
        return TechnicalSignal()

    # RSI: ≤30 → +100, ≥70 → -100, 중간 선형보간 (50-rsi)*5
    rsi_score = 0.0
    if ind.rsi.value is not None:
        rsi_score = max(-100.0, min(100.0, (50 - ind.rsi.value) * 5))

    # MACD: 골든크로스 → +100, 데드크로스 → -100
    macd_score = 0.0
    if ind.macd.signal:
        if "골든크로스" in ind.macd.signal:
            macd_score = 100.0
        elif "데드크로스" in ind.macd.signal:
            macd_score = -100.0

    # BB: 하단 밴드 돌파 → +50, 상단 밴드 돌파 → -50
    bb_score = 0.0
    if ind.bollinger_bands.signal:
        if "하단" in ind.bollinger_bands.signal:
            bb_score = 50.0
        elif "상단" in ind.bollinger_bands.signal:
            bb_score = -50.0

    composite = round((rsi_score + macd_score + bb_score) / 3, 2)

    return TechnicalSignal(
        rsi_score=round(rsi_score, 2),
        macd_score=round(macd_score, 2),
        bb_score=round(bb_score, 2),
        composite=composite,
    )


def _calc_macro_score(client: Client) -> MacroSignal:
    """VIX/금리/지수 기반 거시경제 시그널을 계산한다."""
    snapshot = get_latest(client)
    if snapshot is None:
        logger.warning("No macro snapshot available")
        return MacroSignal()

    # VIX 점수
    vix_score = 0.0
    if snapshot.vix is not None:
        vix = snapshot.vix
        if vix < 15:
            vix_score = 100.0
        elif vix < 20:
            vix_score = 50.0
        elif vix <= 30:
            vix_score = -50.0
        else:
            vix_score = -100.0

    # 금리(US 10Y) 점수
    yield_score = 0.0
    if snapshot.us_10y_yield is not None:
        us_yield = snapshot.us_10y_yield
        if us_yield < 3.5:
            yield_score = 50.0
        elif us_yield < 4.5:
            yield_score = 0.0
        elif us_yield < 5.0:
            yield_score = -50.0
        else:
            yield_score = -100.0

    # 지수 점수: VIX 연동 보조
    index_score = round(vix_score * 0.5, 2)

    composite = round((vix_score + yield_score + index_score) / 3, 2)

    return MacroSignal(
        vix_score=round(vix_score, 2),
        yield_score=round(yield_score, 2),
        index_score=index_score,
        composite=composite,
    )


def _calc_sentiment_score(client: Client) -> SentimentSignal:
    """뉴스 감성 가중 평균 시그널을 계산한다."""
    try:
        results, _total = sentiment_service.get_results(
            client, limit=50, offset=0
        )
    except Exception as e:
        logger.warning("Sentiment results fetch failed: %s", e)
        return SentimentSignal()

    if not results:
        return SentimentSignal()

    # direction 가중 평균: BULLISH→+100, BEARISH→-100, NEUTRAL→0, × confidence
    total_weight = 0.0
    weighted_sum = 0.0
    for r in results:
        direction_val = 0.0
        if r.direction == "BULLISH":
            direction_val = 100.0
        elif r.direction == "BEARISH":
            direction_val = -100.0

        confidence = r.confidence if r.confidence is not None else 0.5
        weighted_sum += direction_val * confidence
        total_weight += confidence

    avg_score = weighted_sum / total_weight if total_weight > 0 else 0.0
    composite = max(-100.0, min(100.0, round(avg_score, 2)))

    return SentimentSignal(
        avg_weighted_score=round(avg_score, 2),
        article_count=len(results),
        composite=composite,
    )


def _calc_currency_score(client: Client) -> CurrencySignal:
    """USD/KRW 환율 기반 시그널을 계산한다."""
    snapshot = get_latest(client)
    if snapshot is None or snapshot.usd_krw is None:
        return CurrencySignal()

    usd_krw = snapshot.usd_krw

    if usd_krw < 1250:
        composite = 80.0
        direction = "BULLISH"
    elif usd_krw < 1300:
        composite = 30.0
        direction = "BULLISH"
    elif usd_krw < 1350:
        composite = 0.0
        direction = "NEUTRAL"
    elif usd_krw < 1400:
        composite = -30.0
        direction = "BEARISH"
    else:
        composite = -80.0
        direction = "BEARISH"

    return CurrencySignal(
        usd_krw=usd_krw,
        usd_krw_direction=direction,
        composite=composite,
    )


def _calc_geopolitical_score(client: Client) -> GeopoliticalSignal:
    """지정학 리스크 시그널을 계산한다."""
    try:
        result = (
            client.table("sentiment_results")
            .select("urgency")
            .eq("event_type", "GEOPOLITICAL")
            .order("analyzed_at", desc=True)
            .limit(50)
            .execute()
        )
        rows = result.data or []
    except Exception as e:
        logger.warning("Geopolitical query failed: %s", e)
        return GeopoliticalSignal()

    if not rows:
        return GeopoliticalSignal()

    # urgency 매핑: HIGH → -100, MEDIUM → -40, LOW → -10
    urgency_map = {"HIGH": -100.0, "MEDIUM": -40.0, "LOW": -10.0}
    scores: list[float] = []
    high_count = 0

    for row in rows:
        urgency = row.get("urgency", "LOW")
        if urgency == "HIGH":
            high_count += 1
        scores.append(urgency_map.get(urgency, -10.0))

    avg_score = sum(scores) / len(scores) if scores else 0.0
    composite = round(max(-100.0, min(100.0, avg_score)), 2)

    return GeopoliticalSignal(
        high_urgency_count=high_count,
        avg_geopolitical_score=round(avg_score, 2),
        composite=composite,
    )


# ═══════════════════════════════════════════════════════════
# (b) 방향 / 리스크 판정
# ═══════════════════════════════════════════════════════════


def _determine_direction(score: float) -> str:
    """종합 점수 기반 방향 판정."""
    if score >= 25:
        return "BULLISH"
    if score <= -25:
        return "BEARISH"
    return "NEUTRAL"


def _determine_risk_level(
    vix: float | None, geopolitical_score: float
) -> str:
    """VIX + 지정학 점수 기반 리스크 레벨 판정."""
    vix_val = vix or 0.0
    if vix_val >= 30 or geopolitical_score < -50:
        return "HIGH"
    if vix_val >= 20 or geopolitical_score < -20:
        return "MEDIUM"
    return "LOW"


# ═══════════════════════════════════════════════════════════
# (c) AI 리포트 생성
# ═══════════════════════════════════════════════════════════


def _get_model_from_db(client: Client) -> str:
    """model_configs 테이블에서 DEEP_REPORT 모델을 조회한다."""
    try:
        result = (
            client.table("model_configs")
            .select("primary_model")
            .eq("config_key", "DEEP_REPORT")
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]["primary_model"]
    except Exception as e:
        logger.warning(
            "Failed to query model_configs: %s — using default", e
        )

    return DEFAULT_MODEL


def _generate_ai_report(
    client: Client,
    ticker: str,
    company_name: str,
    breakdown: SignalBreakdown,
    total_score: float,
    direction: str,
    risk_level: str,
) -> dict:
    """OpenRouter API로 AI 투자 리포트를 생성한다."""
    if not settings.openrouter_api_key:
        logger.warning("OPENROUTER_API_KEY not set — using fallback report")
        return _make_fallback_report(ticker, total_score, direction)

    model = _get_model_from_db(client)
    logger.info("Generating AI report for %s with model: %s", ticker, model)

    t = breakdown.technical
    m = breakdown.macro
    s = breakdown.sentiment
    c = breakdown.currency
    g = breakdown.geopolitical

    prompt = f"""당신은 전문 투자 분석가입니다. 다음 데이터를 기반으로 한국어 투자 리포트를 작성하세요.

## 분석 대상
- 종목: {ticker} ({company_name})

## 5가지 시그널 분석 결과 (-100 ~ +100)

1. 기술적 분석 (가중치 30%): {t.composite}점
   - RSI: {t.rsi_score}, MACD: {t.macd_score}, BB: {t.bb_score}

2. 거시경제 (가중치 25%): {m.composite}점
   - VIX: {m.vix_score}, 금리: {m.yield_score}, 지수: {m.index_score}

3. 뉴스 감성 (가중치 20%): {s.composite}점
   - 기사 {s.article_count}건 가중평균: {s.avg_weighted_score}

4. 환율 (가중치 15%): {c.composite}점
   - USD/KRW: {c.usd_krw}, 방향: {c.usd_krw_direction}

5. 지정학 (가중치 10%): {g.composite}점
   - 고위험 이벤트: {g.high_urgency_count}건

## 종합
- 종합 점수: {total_score:.1f}
- 방향: {direction}
- 리스크: {risk_level}

## 응답 형식 (JSON만 반환)
{{
  "opinion": "2-3문장의 핵심 투자 의견",
  "report_text": "5-8문장의 상세 분석 리포트",
  "scenario_bull": {{
    "title": "강세 시나리오",
    "probability": "30-40%",
    "description": "2-3문장",
    "target": "목표가 또는 상승률"
  }},
  "scenario_base": {{
    "title": "기본 시나리오",
    "probability": "40-50%",
    "description": "2-3문장",
    "target": "예상 범위"
  }},
  "scenario_bear": {{
    "title": "약세 시나리오",
    "probability": "20-30%",
    "description": "2-3문장",
    "target": "지지선 또는 하락률"
  }}
}}

JSON만 반환하세요. 다른 텍스트는 포함하지 마세요."""

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
            timeout=90.0,
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
        logger.error("AI report generation failed: %s", e)
        return _make_fallback_report(ticker, total_score, direction)


def _make_fallback_report(
    ticker: str, score: float, direction: str
) -> dict:
    """AI 실패 시 기본 리포트를 반환한다."""
    dir_text = {"BULLISH": "강세", "BEARISH": "약세", "NEUTRAL": "중립"}
    d = dir_text.get(direction, "중립")

    return {
        "opinion": (
            f"{ticker}의 종합 분석 점수는 {score:.1f}점으로 "
            f"{d} 전망입니다."
        ),
        "report_text": (
            f"{ticker}에 대한 AI 상세 분석을 수행할 수 없습니다. "
            f"종합 점수 {score:.1f}점 기준으로 {d} 방향이 감지되었습니다. "
            f"세부 시그널을 참고하여 투자 판단에 활용하세요."
        ),
        "scenario_bull": {
            "title": "강세 시나리오",
            "probability": "-",
            "description": "AI 분석 불가",
            "target": "-",
        },
        "scenario_base": {
            "title": "기본 시나리오",
            "probability": "-",
            "description": "AI 분석 불가",
            "target": "-",
        },
        "scenario_bear": {
            "title": "약세 시나리오",
            "probability": "-",
            "description": "AI 분석 불가",
            "target": "-",
        },
    }


# ═══════════════════════════════════════════════════════════
# (d) 통합 분석 함수
# ═══════════════════════════════════════════════════════════


def analyze_ticker(
    client: Client,
    ticker: str,
    user_id: str,
    company_name: str | None = None,
) -> PredictionAnalyzeResponse:
    """5개 시그널을 계산하고 AI 리포트를 생성하여 DB에 저장한다."""
    analyzed_at = datetime.now(timezone.utc)

    # 1. 종목명 자동 조회
    if not company_name:
        try:
            quote = stock_service.fetch_quote(ticker)
            company_name = quote.name or ticker
        except Exception:
            company_name = ticker

    # 2. 5개 시그널 계산
    logger.info("Calculating signals for %s (%s)", ticker, company_name)
    tech = _calc_technical_score(ticker)
    macro = _calc_macro_score(client)
    sentiment = _calc_sentiment_score(client)
    currency = _calc_currency_score(client)
    geo = _calc_geopolitical_score(client)

    breakdown = SignalBreakdown(
        technical=tech,
        macro=macro,
        sentiment=sentiment,
        currency=currency,
        geopolitical=geo,
    )

    # 3. 가중 합산: T×0.30 + M×0.25 + S×0.20 + C×0.15 + G×0.10
    total_score = round(
        tech.composite * WEIGHT_TECHNICAL
        + macro.composite * WEIGHT_MACRO
        + sentiment.composite * WEIGHT_SENTIMENT
        + currency.composite * WEIGHT_CURRENCY
        + geo.composite * WEIGHT_GEOPOLITICAL,
        2,
    )

    # 4. 방향/리스크 결정
    direction = _determine_direction(total_score)
    snapshot = get_latest(client)
    vix = snapshot.vix if snapshot else None
    risk_level = _determine_risk_level(vix, geo.composite)

    # 5. AI 리포트 생성
    logger.info(
        "Generating AI report for %s (score: %.1f, dir: %s)",
        ticker,
        total_score,
        direction,
    )
    report = _generate_ai_report(
        client,
        ticker,
        company_name,
        breakdown,
        total_score,
        direction,
        risk_level,
    )

    # 6. prediction_scores INSERT
    row = {
        "user_id": user_id,
        "ticker": ticker,
        "company_name": company_name,
        "technical_score": tech.composite,
        "macro_score": macro.composite,
        "sentiment_score": sentiment.composite,
        "currency_score": currency.composite,
        "geopolitical_score": geo.composite,
        "short_term_score": total_score,
        "medium_term_score": None,
        "direction": direction,
        "risk_level": risk_level,
        "opinion": report.get("opinion"),
        "report_text": report.get("report_text"),
        "scenario_bull": report.get("scenario_bull"),
        "scenario_base": report.get("scenario_base"),
        "scenario_bear": report.get("scenario_bear"),
        "analyzed_at": analyzed_at.isoformat(),
    }

    result = client.table("prediction_scores").insert(row).execute()
    inserted = result.data[0]
    logger.info("Prediction score saved: %s for %s", inserted["id"], ticker)

    # 7. 응답
    score_response = _row_to_response(inserted)
    return PredictionAnalyzeResponse(
        success=True,
        ticker=ticker,
        score=score_response,
        signal_breakdown=breakdown,
    )


# ═══════════════════════════════════════════════════════════
# (e) 조회 함수
# ═══════════════════════════════════════════════════════════


def get_latest_prediction(
    client: Client,
    user_id: str,
    ticker: str,
) -> PredictionScoreResponse | None:
    """특정 종목의 최신 예측 1건을 반환한다."""
    result = (
        client.table("prediction_scores")
        .select("*")
        .eq("user_id", user_id)
        .eq("ticker", ticker)
        .order("analyzed_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        return None
    return _row_to_response(result.data[0])


def get_user_predictions(
    client: Client,
    user_id: str,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[PredictionScoreResponse], int]:
    """사용자의 예측 결과를 페이지네이션으로 반환한다."""
    count_result = (
        client.table("prediction_scores")
        .select("id", count="exact")
        .eq("user_id", user_id)
        .execute()
    )
    total = count_result.count or 0

    result = (
        client.table("prediction_scores")
        .select("*")
        .eq("user_id", user_id)
        .order("analyzed_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    return [_row_to_response(row) for row in result.data], total


def _row_to_response(row: dict) -> PredictionScoreResponse:
    """DB row를 응답 모델로 변환한다."""
    return PredictionScoreResponse(
        id=row["id"],
        user_id=row["user_id"],
        ticker=row["ticker"],
        company_name=row.get("company_name"),
        technical_score=row.get("technical_score"),
        macro_score=row.get("macro_score"),
        sentiment_score=row.get("sentiment_score"),
        currency_score=row.get("currency_score"),
        geopolitical_score=row.get("geopolitical_score"),
        short_term_score=float(row.get("short_term_score", 0)),
        medium_term_score=row.get("medium_term_score"),
        direction=row.get("direction", "NEUTRAL"),
        risk_level=row.get("risk_level", "LOW"),
        opinion=row.get("opinion"),
        report_text=row.get("report_text"),
        scenario_bull=row.get("scenario_bull"),
        scenario_base=row.get("scenario_base"),
        scenario_bear=row.get("scenario_bear"),
        analyzed_at=row["analyzed_at"],
        created_at=row["created_at"],
    )
