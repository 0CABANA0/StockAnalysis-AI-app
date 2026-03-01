"""주간 리포트 생성 서비스.

일주일간의 daily_briefings, macro_snapshots, geopolitical_risks를 집계하여
AI가 주간 종합 리포트(macro_summary, geo_summary, next_week_outlook, strategy_guide)를 생성한다.
"""

import json
from datetime import date, timedelta

import httpx
from supabase import Client

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "anthropic/claude-sonnet-4-20250514"


def _get_model_from_db(client: Client) -> str:
    """model_configs에서 주간 리포트 생성용 모델을 조회한다."""
    try:
        result = (
            client.table("model_configs")
            .select("model_id")
            .eq("feature", "weekly_report")
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]["model_id"]
    except Exception as e:
        logger.warning("model_configs query failed (weekly_report): %s — using default", e)
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


# ─── 주간 컨텍스트 수집 ───


def _gather_weekly_context(client: Client, week_start: date) -> dict:
    """한 주간의 데이터를 수집하여 AI 프롬프트 컨텍스트를 구성한다.

    Parameters
    ----------
    client : supabase.Client
    week_start : date
        해당 주 월요일 날짜 (ISO 형식)
    """
    week_end = week_start + timedelta(days=6)
    start_str = week_start.isoformat()
    end_str = week_end.isoformat()
    context: dict = {}

    # 1. 해당 주 daily_briefings 집계
    try:
        result = (
            client.table("daily_briefings")
            .select("briefing_date, market_summary, geo_summary, action_cards, key_events")
            .gte("briefing_date", start_str)
            .lte("briefing_date", end_str)
            .order("briefing_date")
            .execute()
        )
        context["daily_briefings"] = result.data or []
    except Exception as e:
        logger.warning("Weekly context — daily_briefings fetch failed: %s", e)
        context["daily_briefings"] = []

    # 2. 해당 주 거시경제 스냅샷
    try:
        result = (
            client.table("macro_snapshots")
            .select("collected_at, vix, us_10y_yield, usd_krw, wti, gold, sp500, nasdaq, kospi")
            .gte("collected_at", f"{start_str}T00:00:00")
            .lte("collected_at", f"{end_str}T23:59:59")
            .order("collected_at")
            .execute()
        )
        context["macro_snapshots"] = result.data or []
    except Exception as e:
        logger.warning("Weekly context — macro_snapshots fetch failed: %s", e)
        context["macro_snapshots"] = []

    # 3. 해당 주 활성 지정학 리스크
    try:
        result = (
            client.table("geopolitical_risks")
            .select("title, risk_level, category, description, affected_markets")
            .eq("status", "ACTIVE")
            .order("risk_level", desc=True)
            .limit(10)
            .execute()
        )
        context["geo_risks"] = result.data or []
    except Exception as e:
        logger.warning("Weekly context — geo_risks fetch failed: %s", e)
        context["geo_risks"] = []

    # 4. 해당 주 지정학 이벤트
    try:
        result = (
            client.table("geopolitical_events")
            .select("event_title, event_date, severity, description")
            .gte("event_date", start_str)
            .lte("event_date", end_str)
            .order("event_date")
            .limit(20)
            .execute()
        )
        context["geo_events"] = result.data or []
    except Exception as e:
        logger.warning("Weekly context — geo_events fetch failed: %s", e)
        context["geo_events"] = []

    # 5. 해당 주 감성 분석 요약
    try:
        result = (
            client.table("sentiment_results")
            .select("direction, urgency, reasoning, analyzed_at")
            .gte("analyzed_at", f"{start_str}T00:00:00")
            .lte("analyzed_at", f"{end_str}T23:59:59")
            .execute()
        )
        rows = result.data or []
        bullish = sum(1 for r in rows if r.get("direction") == "BULLISH")
        bearish = sum(1 for r in rows if r.get("direction") == "BEARISH")
        high_urgency = [
            r.get("reasoning", "") for r in rows if r.get("urgency") == "HIGH"
        ][:5]
        context["sentiment_summary"] = {
            "total": len(rows),
            "bullish": bullish,
            "bearish": bearish,
            "neutral": len(rows) - bullish - bearish,
            "high_urgency_items": high_urgency,
        }
    except Exception as e:
        logger.warning("Weekly context — sentiment fetch failed: %s", e)
        context["sentiment_summary"] = {}

    # 6. 공포/탐욕 지수 (최신)
    try:
        result = (
            client.table("fear_greed_snapshots")
            .select("index_value, label, collected_at")
            .order("collected_at", desc=True)
            .limit(1)
            .execute()
        )
        context["fear_greed"] = result.data[0] if result.data else None
    except Exception as e:
        logger.warning("Weekly context — fear_greed fetch failed: %s", e)
        context["fear_greed"] = None

    return context


# ─── 주간 리포트 생성 ───


def generate_weekly_report(client: Client, target_date: date | None = None) -> dict:
    """주간 리포트를 생성하여 weekly_reports 테이블에 UPSERT한다.

    Parameters
    ----------
    client : supabase.Client
    target_date : date | None
        리포트 대상 주의 월요일. None이면 직전 주 월요일을 자동 계산.
    """
    if target_date is None:
        # 직전 주 월요일 계산: 오늘이 월요일이면 7일 전, 아니면 지난 월요일
        today = date.today()
        days_since_monday = today.weekday()  # 월=0, 일=6
        last_monday = today - timedelta(days=days_since_monday + 7)
        target_date = last_monday

    week_start_str = target_date.isoformat()
    week_end = target_date + timedelta(days=6)
    logger.info("Generating weekly report for %s ~ %s", week_start_str, week_end.isoformat())

    context = _gather_weekly_context(client, target_date)
    model = _get_model_from_db(client)

    if not settings.openrouter_api_key:
        logger.warning("OPENROUTER_API_KEY not set — generating fallback weekly report")
        return _save_fallback_report(client, week_start_str, context)

    context_json = json.dumps(context, ensure_ascii=False, default=str)

    prompt = f"""당신은 시니어 투자 전략가입니다. 아래 한 주간의 시장 데이터를 기반으로 **주간 종합 리포트**를 작성하세요.

## 리포트 기간: {week_start_str} ~ {week_end.isoformat()}

## 이번 주 시장 데이터
{context_json}

## 작성 원칙
1. **일간 브리핑 종합**: daily_briefings의 market_summary들을 종합하여 주간 트렌드와 변곡점을 도출하세요.
2. **거시경제 흐름**: macro_snapshots의 지표 변동(VIX, 금리, 환율, 유가, 금, 지수)에서 주간 추세를 파악하세요.
3. **지정학 리스크**: 활성 리스크와 주간 이벤트를 종합하여 시장 영향을 분석하세요.
4. **감성 지표**: 뉴스 감성 분석과 공포/탐욕 지수를 반영하세요.
5. **초보자 교육**: 투자 초보자가 읽고 이해할 수 있도록 경제 용어를 쉽게 풀어 설명하세요.
6. **인과관계 중심**: "A 때문에 B가 발생했고, 다음 주에는 C가 예상된다"는 식으로 논리적 연결을 명확히 하세요.

## 응답 형식 (JSON만 반환)
{{
  "macro_summary": "거시경제 주간 요약 — 이번 주 주요 경제 지표 변동, 중앙은행 정책, 시장 반응을 종합 (8-15문장, 한국어). 주간 추세 변화와 그 원인을 인과관계로 설명.",
  "geo_summary": "지정학 상황 요약 — 이번 주 주요 지정학 이벤트, 리스크 변화, 시장 영향을 종합 (6-10문장, 한국어). 어떤 섹터/시장이 영향을 받았는지 명시.",
  "next_week_outlook": "다음 주 전망 — 이번 주 흐름을 바탕으로 다음 주 예상 시나리오와 주요 이벤트 (6-10문장, 한국어). 주시해야 할 지표와 이벤트를 구체적으로 언급.",
  "strategy_guide": "투자 전략 가이드 — 초보자를 위한 구체적 행동 지침 (8-12문장, 한국어). '~을 주시하라', '~비중을 조절하라' 등 실행 가능한 조언. 리스크 관리 방안 포함."
}}

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
            timeout=120.0,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        report = _parse_ai_json(content)

    except Exception as e:
        logger.error("Weekly report generation failed: %s", e)
        return _save_fallback_report(client, week_start_str, context)

    # UPSERT
    row = {
        "week_start_date": week_start_str,
        "macro_summary": report.get("macro_summary"),
        "geo_summary": report.get("geo_summary"),
        "next_week_outlook": report.get("next_week_outlook"),
        "strategy_guide": report.get("strategy_guide"),
    }

    try:
        client.table("weekly_reports").upsert(
            row, on_conflict="week_start_date"
        ).execute()
        logger.info("Weekly report saved for week starting %s", week_start_str)
    except Exception as e:
        logger.error("Failed to save weekly report: %s", e)

    return {"success": True, "week_start_date": week_start_str, **row}


def _save_fallback_report(client: Client, week_start_str: str, context: dict) -> dict:
    """AI 호출 실패 시 기본 주간 리포트를 생성한다."""
    briefings = context.get("daily_briefings", [])
    summaries = [b.get("market_summary", "") for b in briefings if b.get("market_summary")]

    macro_summary = (
        f"이번 주 {len(briefings)}일간의 시장 데이터를 수집했습니다. "
        + (f"주요 요약: {summaries[0][:200]}" if summaries else "상세 분석은 AI 엔진 복구 후 제공됩니다.")
    )

    geo_risks = context.get("geo_risks", [])
    high_risks = [r["title"] for r in geo_risks if r.get("risk_level") in ("HIGH", "CRITICAL")]
    geo_summary = (
        f"주요 지정학 리스크: {', '.join(high_risks[:3]) if high_risks else '특이사항 없음'}. "
        "상세 분석은 AI 엔진 복구 후 제공됩니다."
    )

    row = {
        "week_start_date": week_start_str,
        "macro_summary": macro_summary,
        "geo_summary": geo_summary,
        "next_week_outlook": "AI 분석 엔진이 일시적으로 사용 불가합니다. 복구 후 전망이 제공됩니다.",
        "strategy_guide": "현재 AI 분석이 불가하여 전략 가이드를 제공할 수 없습니다. 변동성이 큰 시기에는 보수적 접근을 권장합니다.",
    }

    try:
        client.table("weekly_reports").upsert(
            row, on_conflict="week_start_date"
        ).execute()
    except Exception as e:
        logger.error("Fallback weekly report save failed: %s", e)

    return {"success": True, "week_start_date": week_start_str, **row}


# ─── 조회 ───


def get_weekly_report(client: Client, week_start_date: str) -> dict | None:
    """특정 주의 리포트를 조회한다."""
    try:
        result = (
            client.table("weekly_reports")
            .select("*")
            .eq("week_start_date", week_start_date)
            .execute()
        )
        return result.data[0] if result.data else None
    except Exception as e:
        logger.error("Weekly report fetch failed for %s: %s", week_start_date, e)
        return None


def list_weekly_reports(client: Client, limit: int = 12) -> list[dict]:
    """최근 주간 리포트 목록을 반환한다."""
    try:
        result = (
            client.table("weekly_reports")
            .select("id, week_start_date, created_at")
            .order("week_start_date", desc=True)
            .limit(limit)
            .execute()
        )
        return result.data or []
    except Exception as e:
        logger.error("Weekly reports list failed: %s", e)
        return []
