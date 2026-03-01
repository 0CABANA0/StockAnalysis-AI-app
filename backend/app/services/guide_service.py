"""투자 가이드 생성 서비스.

거시경제 + 지정학 + 감성 + 기술적 분석을 종합하여
daily_briefings(오늘의 가이드)와 investment_guides(종목별 가이드)를 생성한다.
"""

import json
from datetime import date, datetime, timezone

import httpx
from supabase import Client

from app.config import settings
from app.services import stock_service
from app.services.supabase_client import get_latest
from app.utils.logger import get_logger

logger = get_logger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "claude-sonnet-4-20250514"


def _get_model_from_db(client: Client) -> str:
    """model_configs에서 가이드 생성용 모델을 조회한다."""
    try:
        result = (
            client.table("model_configs")
            .select("model_id")
            .eq("feature", "guide")
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]["model_id"]
    except Exception as e:
        logger.warning("model_configs query failed: %s — using default", e)
    return DEFAULT_MODEL


def _parse_ai_json(content: str) -> dict:
    """AI 응답에서 JSON을 추출한다."""
    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1] if "\n" in content else content
        if content.endswith("```"):
            content = content[: -len("```")]
        content = content.strip()
    return json.loads(content)


# ─── 컨텍스트 수집 ───


def _gather_context(client: Client) -> dict:
    """AI 프롬프트에 전달할 컨텍스트를 수집한다."""
    context: dict = {}

    # 1. 최신 거시경제 스냅샷
    snapshot = get_latest(client)
    if snapshot:
        context["macro"] = {
            "vix": snapshot.vix,
            "us_10y_yield": snapshot.us_10y_yield,
            "usd_krw": snapshot.usd_krw,
            "wti": snapshot.wti,
            "gold": snapshot.gold,
        }

    # 2. 활성 지정학 리스크
    try:
        geo_result = (
            client.table("geopolitical_risks")
            .select("risk_id, title, risk_level, category")
            .eq("status", "ACTIVE")
            .order("risk_level", desc=True)
            .limit(8)
            .execute()
        )
        context["geo_risks"] = geo_result.data or []
    except Exception as e:
        logger.warning("Geo risks fetch failed: %s", e)
        context["geo_risks"] = []

    # 3. 최근 감성 분석 요약
    try:
        sent_result = (
            client.table("sentiment_results")
            .select("direction, urgency, reasoning")
            .order("analyzed_at", desc=True)
            .limit(20)
            .execute()
        )
        rows = sent_result.data or []
        bullish = sum(1 for r in rows if r.get("direction") == "BULLISH")
        bearish = sum(1 for r in rows if r.get("direction") == "BEARISH")
        high_urgency = [
            r.get("reasoning", "") for r in rows if r.get("urgency") == "HIGH"
        ][:3]
        context["sentiment"] = {
            "total": len(rows),
            "bullish": bullish,
            "bearish": bearish,
            "neutral": len(rows) - bullish - bearish,
            "high_urgency_items": high_urgency,
        }
    except Exception as e:
        logger.warning("Sentiment fetch failed: %s", e)
        context["sentiment"] = {}

    # 4. 인기 관심종목 (상위 10개)
    try:
        wl_result = (
            client.table("watchlist")
            .select("ticker, company_name")
            .limit(50)
            .execute()
        )
        ticker_counts: dict[str, dict] = {}
        for row in wl_result.data or []:
            t = row["ticker"]
            if t not in ticker_counts:
                ticker_counts[t] = {"ticker": t, "company_name": row["company_name"], "count": 0}
            ticker_counts[t]["count"] += 1

        popular = sorted(ticker_counts.values(), key=lambda x: x["count"], reverse=True)[:10]
        context["popular_tickers"] = popular
    except Exception as e:
        logger.warning("Watchlist fetch failed: %s", e)
        context["popular_tickers"] = []

    # 5. 오늘 경제 캘린더
    today_str = date.today().isoformat()
    try:
        cal_result = (
            client.table("economic_calendar")
            .select("event_title, importance, country")
            .eq("event_date", today_str)
            .execute()
        )
        context["today_events"] = cal_result.data or []
    except Exception as e:
        logger.warning("Calendar fetch failed: %s", e)
        context["today_events"] = []

    return context


# ─── 일간 가이드 생성 ───


def generate_daily_guide(client: Client) -> dict:
    """오늘의 투자 가이드를 생성하여 daily_briefings에 UPSERT한다."""
    today_str = date.today().isoformat()
    context = _gather_context(client)
    model = _get_model_from_db(client)

    if not settings.openrouter_api_key:
        logger.warning("OPENROUTER_API_KEY not set — generating fallback guide")
        return _save_fallback_briefing(client, today_str, context)

    context_json = json.dumps(context, ensure_ascii=False, default=str)

    prompt = f"""당신은 전문 투자 분석가입니다. 아래 시장 데이터를 기반으로 오늘의 투자 가이드를 작성하세요.

## 오늘 날짜: {today_str}

## 시장 데이터
{context_json}

## 핵심 원칙
1. 모든 분석에는 반드시 **근거 사유**(왜 이 현상이 발생하는가)와 **뒷받침 논리**(어떤 경제 원리·역사적 패턴이 이를 지지하는가)를 함께 제시하세요.
2. market_causal_chain에서 거시경제·지정학 이벤트가 시장에 미치는 **연쇄 영향**을 단계별로 설명하세요.
   예: 금값 상승 → 달러 약세 → 원/달러 환율 하락 → 수출기업 수익 감소 → 반대로 내수주 수혜
3. 각 단계마다 "왜 이 연결이 성립하는지"를 reasoning 필드에 명확히 서술하세요.

## 응답 형식 (JSON만 반환)
{{
  "market_summary": "3-5문장의 오늘 시장 현황 요약 (한국어). 핵심 지표 변동의 원인과 영향을 포함할 것.",
  "geo_summary": "2-3문장의 지정학 리스크 요약 (한국어). 어떤 섹터/시장에 영향을 미치는지 명시할 것.",
  "market_causal_chain": [
    {{
      "event": "원인 이벤트 (예: '미국 CPI 예상 상회 +0.3%p')",
      "impact": "결과 영향 (예: '연준 금리 인하 기대 후퇴 → 국채금리 상승 → 성장주 약세')",
      "reasoning": "근거 사유 + 뒷받침 논리 (예: 'CPI 상승은 인플레이션 지속을 의미하며, 연준은 물가 안정 목표 2%를 달성할 때까지 긴축 기조를 유지할 가능성이 높다. 역사적으로 금리 인상기에는 성장주의 밸류에이션 부담이 커진다.')",
      "affected_sectors": ["반도체", "테크", "바이오"],
      "direction": "NEGATIVE 또는 POSITIVE 또는 MIXED"
    }}
  ],
  "action_cards": [
    {{
      "ticker": "종목코드 (예: AAPL, 005930.KS)",
      "company_name": "회사명 (한국어)",
      "action": "BUY, SELL, HOLD, WATCH, AVOID 중 하나",
      "reason": "2-3문장의 근거 — 왜 이 판단인지 인과관계를 포함하여 설명 (한국어)"
    }}
  ],
  "key_events": [
    {{
      "time": "시간 (예: '09:00', '종일')",
      "title": "이벤트명 (한국어)",
      "importance": "HIGH, MEDIUM, LOW 중 하나"
    }}
  ]
}}

market_causal_chain은 3~5단계, action_cards는 3~6개, key_events는 2~5개로 작성하세요.
market_causal_chain의 각 단계는 이전 단계의 결과가 다음 단계의 원인이 되도록 연쇄적으로 구성하세요.
JSON만 응답하세요. 다른 텍스트 포함 금지."""

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
        guide = _parse_ai_json(content)

    except Exception as e:
        logger.error("Daily guide generation failed: %s", e)
        return _save_fallback_briefing(client, today_str, context)

    # UPSERT
    row = {
        "briefing_date": today_str,
        "market_summary": guide.get("market_summary"),
        "geo_summary": guide.get("geo_summary"),
        "market_causal_chain": guide.get("market_causal_chain", []),
        "action_cards": guide.get("action_cards", []),
        "key_events": guide.get("key_events", []),
    }

    try:
        client.table("daily_briefings").upsert(
            row, on_conflict="briefing_date"
        ).execute()
        logger.info("Daily briefing saved for %s", today_str)
    except Exception as e:
        logger.error("Failed to save daily briefing: %s", e)

    return {"success": True, "briefing_date": today_str, **row}


def _save_fallback_briefing(client: Client, today_str: str, context: dict) -> dict:
    """AI 호출 실패 시 기본 브리핑을 생성한다."""
    macro = context.get("macro", {})
    vix = macro.get("vix")
    usd_krw = macro.get("usd_krw")

    vix_text = f"VIX {vix:.1f}" if vix else "VIX 데이터 없음"
    fx_text = f"원/달러 {usd_krw:,.0f}원" if usd_krw else "환율 데이터 없음"

    market_summary = (
        f"오늘의 시장: {vix_text}, {fx_text}. "
        "AI 상세 분석은 데이터 수집 완료 후 제공됩니다."
    )

    geo_risks = context.get("geo_risks", [])
    high_risks = [r["title"] for r in geo_risks if r.get("risk_level") in ("HIGH", "CRITICAL")]
    geo_summary = (
        f"주요 지정학 리스크: {', '.join(high_risks[:3]) if high_risks else '특이사항 없음'}."
    )

    events = context.get("today_events", [])
    key_events = [
        {
            "time": "종일",
            "title": ev.get("event_title", ""),
            "importance": ev.get("importance", "MEDIUM"),
        }
        for ev in events[:5]
    ]

    row = {
        "briefing_date": today_str,
        "market_summary": market_summary,
        "geo_summary": geo_summary,
        "action_cards": [],
        "key_events": key_events,
    }

    try:
        client.table("daily_briefings").upsert(
            row, on_conflict="briefing_date"
        ).execute()
    except Exception as e:
        logger.error("Fallback briefing save failed: %s", e)

    return {"success": True, "briefing_date": today_str, **row}


# ─── 종목별 가이드 생성 ───


def generate_ticker_guide(client: Client, ticker: str) -> dict:
    """개별 종목 가이드를 생성하여 investment_guides에 UPSERT한다."""
    today_str = date.today().isoformat()
    context = _gather_context(client)
    model = _get_model_from_db(client)

    # 기술적 지표 수집
    tech_data: dict = {}
    try:
        indicators = stock_service.fetch_indicators(ticker)
        ind = indicators.indicators
        tech_data = {
            "rsi": ind.rsi.value,
            "rsi_signal": ind.rsi.signal,
            "macd_signal": ind.macd.signal,
            "bb_signal": ind.bollinger_bands.signal,
        }
    except Exception as e:
        logger.warning("Technical indicators failed for %s: %s", ticker, e)

    # 종목명 조회
    company_name = ticker
    try:
        quote = stock_service.fetch_quote(ticker)
        company_name = quote.name or ticker
        tech_data["current_price"] = quote.price
    except Exception as e:
        logger.warning("종목 시세 조회 실패 (%s): %s", ticker, e)

    if not settings.openrouter_api_key:
        logger.warning("OPENROUTER_API_KEY not set — generating fallback ticker guide")
        return _save_fallback_ticker_guide(client, ticker, company_name, today_str)

    context_json = json.dumps(
        {"macro": context.get("macro"), "geo_risks": context.get("geo_risks"), "technical": tech_data},
        ensure_ascii=False,
        default=str,
    )

    prompt = f"""당신은 독립적 투자 분석가입니다. 뉴스·증권사 리포트를 단순 요약하지 마세요.
아래 데이터를 기반으로 {ticker} ({company_name}) 종목의 투자 가이드를 **인과관계 중심**으로 작성하세요.

## 오늘 날짜: {today_str}

## 분석 데이터
{context_json}

## 핵심 원칙
1. **뉴스 요약 금지**: "~가 예상됩니다", "~전망입니다" 같은 증권사 투로 금지. 대신 "A이므로 → B가 발생하고 → 이 종목에 C 영향"처럼 인과관계를 직접 추론하세요.
2. **causal_chain이 근거**: 거시경제·지정학 데이터에서 이 종목까지 이어지는 영향 경로를 단계별로 구성하고, 이 체인이 action(매수/매도/홀딩) 판단의 **직접적 근거**가 되어야 합니다.
3. **초보자 교육**: 각 단계의 reasoning에 "왜 이 연결이 성립하는지" 경제 원리를 초보자도 이해할 수 있게 설명하세요.
4. **구체적 수치 인용**: 데이터에 있는 실제 수치(VIX, 환율, RSI 등)를 reasoning에 포함하세요.

## 응답 형식 (JSON만 반환)
{{
  "action": "BUY, SELL, HOLD, WATCH, AVOID 중 하나",
  "causal_chain": [
    {{
      "event": "거시경제/지정학 원인 이벤트 (예: 'VIX 22.5로 불안 심리 확대')",
      "impact": "이 종목에 미치는 연쇄 영향 (예: '반도체 수요 전망 하향 → {company_name} 실적 우려')",
      "reasoning": "왜 이 연결이 성립하는지 경제 원리 설명 — 초보자도 이해 가능하게 (예: 'VIX가 20을 넘으면 기관 투자자들이 위험자산 비중을 줄이는 경향이 있고, 이는 성장주 중심으로 매도 압력을 만든다.')",
      "affected_sectors": ["이 종목이 속한 섹터", "연관 섹터"],
      "direction": "NEGATIVE 또는 POSITIVE 또는 MIXED"
    }}
  ],
  "macro_reasoning": "거시경제 관점 분석 — causal_chain에서 도출된 핵심 논리 요약 (3-4문장, 한국어)",
  "geo_reasoning": "지정학 관점 분석 — 현재 리스크가 이 종목에 미치는 구체적 영향 경로 (3-4문장, 한국어)",
  "technical_reasoning": "기술적 분석 — RSI/MACD/BB 등 수치를 인용하며 매매 타이밍 근거 (3-4문장, 한국어)",
  "target_price": 목표가 (숫자, 설정 불가 시 null),
  "stop_loss": 손절가 (숫자, 설정 불가 시 null),
  "confidence": 0.0~1.0 신뢰도,
  "risk_tags": ["구체적 리스크 — 예: 금리인상", "환율변동"],
  "fx_impact": "환율 변동이 이 종목에 미치는 구체적 영향 (단순 '부정적' 말고 왜 부정적인지)",
  "full_report_text": "종합 투자 의견 — causal_chain 전체를 서사적으로 연결하여 '왜 이 판단인지' 초보자가 읽고 이해할 수 있게 작성 (6-10문장, 한국어)"
}}

causal_chain은 3~5단계, 거시경제 → 산업 → 이 종목으로 좁혀가며 연쇄 구성하세요.
JSON만 응답하세요. 다른 텍스트 포함 금지."""

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
        guide = _parse_ai_json(content)

    except Exception as e:
        logger.error("Ticker guide generation failed for %s: %s", ticker, e)
        return _save_fallback_ticker_guide(client, ticker, company_name, today_str)

    # UPSERT
    row = {
        "ticker": ticker,
        "guide_date": today_str,
        "action": guide.get("action", "WATCH"),
        "causal_chain": guide.get("causal_chain", []),
        "macro_reasoning": guide.get("macro_reasoning"),
        "geo_reasoning": guide.get("geo_reasoning"),
        "technical_reasoning": guide.get("technical_reasoning"),
        "target_price": guide.get("target_price"),
        "stop_loss": guide.get("stop_loss"),
        "confidence": guide.get("confidence"),
        "risk_tags": guide.get("risk_tags", []),
        "fx_impact": guide.get("fx_impact"),
        "full_report_text": guide.get("full_report_text"),
    }

    try:
        client.table("investment_guides").upsert(
            row, on_conflict="ticker,guide_date"
        ).execute()
        logger.info("Ticker guide saved for %s on %s", ticker, today_str)
    except Exception as e:
        logger.error("Failed to save ticker guide: %s", e)

    return {"success": True, "ticker": ticker, "guide_date": today_str, **row}


def _save_fallback_ticker_guide(
    client: Client, ticker: str, company_name: str, today_str: str
) -> dict:
    """AI 실패 시 기본 종목 가이드."""
    row = {
        "ticker": ticker,
        "guide_date": today_str,
        "action": "WATCH",
        "macro_reasoning": "거시경제 데이터 분석이 아직 완료되지 않았습니다.",
        "geo_reasoning": "지정학 리스크 분석이 아직 완료되지 않았습니다.",
        "technical_reasoning": "기술적 지표 분석이 아직 완료되지 않았습니다.",
        "confidence": 0.0,
        "risk_tags": [],
        "full_report_text": (
            f"{company_name}({ticker})에 대한 AI 분석을 수행할 수 없습니다. "
            "데이터 수집 완료 후 상세 분석이 제공됩니다."
        ),
    }

    try:
        client.table("investment_guides").upsert(
            row, on_conflict="ticker,guide_date"
        ).execute()
    except Exception as e:
        logger.error("Fallback ticker guide save failed: %s", e)

    return {"success": True, "ticker": ticker, "guide_date": today_str, **row}
