"""AI Q&A 서비스 — 질문에 따라 컨텍스트를 수집하고 AI 답변 생성."""

import json
import re
from datetime import datetime, timezone

import httpx
from supabase import Client

from app.config import settings
from app.services.supabase_client import get_latest
from app.utils.logger import get_logger

logger = get_logger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "claude-sonnet-4-20250514"

# 딥링크 매핑: 키워드 → 페이지
DEEPLINK_KEYWORDS: dict[str, dict] = {
    "거시": {"label": "거시경제 대시보드", "url": "/macro"},
    "macro": {"label": "거시경제 대시보드", "url": "/macro"},
    "금리": {"label": "거시경제 대시보드", "url": "/macro"},
    "vix": {"label": "공포/탐욕 지수", "url": "/fear-greed"},
    "공포": {"label": "공포/탐욕 지수", "url": "/fear-greed"},
    "탐욕": {"label": "공포/탐욕 지수", "url": "/fear-greed"},
    "지정학": {"label": "지정학 리스크", "url": "/geo"},
    "전쟁": {"label": "지정학 리스크", "url": "/geo"},
    "무역": {"label": "지정학 리스크", "url": "/geo"},
    "etf": {"label": "ETF 스크리너", "url": "/etf"},
    "가이드": {"label": "투자 가이드", "url": "/guide"},
    "추천": {"label": "종목 추천", "url": "/recommend"},
    "시뮬": {"label": "시나리오 시뮬레이터", "url": "/simulator"},
    "캘린더": {"label": "경제 캘린더", "url": "/calendar"},
    "용어": {"label": "용어사전", "url": "/glossary"},
}


def _get_model_from_db(client: Client) -> str:
    """model_configs에서 Q&A용 모델을 조회한다."""
    try:
        result = (
            client.table("model_configs")
            .select("model_id")
            .eq("feature", "ask")
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]["model_id"]
    except Exception as e:
        logger.warning("model_configs query failed: %s — using default", e)
    return DEFAULT_MODEL


def _build_context(client: Client, question: str) -> dict:
    """질문 내용에 따라 관련 데이터를 동적으로 수집한다."""
    context: dict = {}
    q_lower = question.lower()

    # 거시경제 컨텍스트 (항상 포함 — 기본)
    snapshot = get_latest(client)
    if snapshot:
        context["macro"] = {
            "vix": snapshot.vix,
            "us_10y_yield": snapshot.us_10y_yield,
            "usd_krw": snapshot.usd_krw,
            "wti": snapshot.wti,
            "gold": snapshot.gold,
        }

    # 지정학 키워드 감지
    geo_keywords = ["지정학", "전쟁", "분쟁", "제재", "관세", "중동", "대만", "러시아", "북한", "무역"]
    if any(kw in q_lower for kw in geo_keywords):
        try:
            geo_result = (
                client.table("geopolitical_risks")
                .select("risk_id, title, risk_level, category")
                .eq("status", "ACTIVE")
                .limit(8)
                .execute()
            )
            context["geo_risks"] = geo_result.data or []
        except Exception as e:
            logger.warning("Geo context fetch failed: %s", e)

    # 티커 감지 (대문자 영문+숫자, 예: AAPL, 005930.KS)
    ticker_pattern = re.findall(r'\b([A-Z]{1,5}(?:\.[A-Z]{1,2})?|\d{6}\.[A-Z]{2})\b', question)
    if ticker_pattern:
        context["mentioned_tickers"] = ticker_pattern[:5]

    # 감성 분석 컨텍스트
    sentiment_keywords = ["감성", "뉴스", "시장 분위기", "센티먼트", "심리"]
    if any(kw in q_lower for kw in sentiment_keywords):
        try:
            sent_result = (
                client.table("sentiment_results")
                .select("direction, reasoning")
                .order("analyzed_at", desc=True)
                .limit(10)
                .execute()
            )
            context["recent_sentiment"] = sent_result.data or []
        except Exception as e:
            logger.warning("Sentiment context fetch failed: %s", e)

    # 공포/탐욕 컨텍스트
    fg_keywords = ["공포", "탐욕", "fear", "greed", "심리지수"]
    if any(kw in q_lower for kw in fg_keywords):
        try:
            fg_result = (
                client.table("fear_greed_snapshots")
                .select("index_value, label, components")
                .order("snapshot_at", desc=True)
                .limit(1)
                .execute()
            )
            if fg_result.data:
                context["fear_greed"] = fg_result.data[0]
        except Exception as e:
            logger.warning("Fear/greed context fetch failed: %s", e)

    return context


def _extract_deeplinks(question: str, answer: str) -> list[dict]:
    """질문+답변에서 관련 페이지 딥링크를 추출한다."""
    combined = (question + " " + answer).lower()
    seen_urls: set[str] = set()
    links: list[dict] = []

    for keyword, link_info in DEEPLINK_KEYWORDS.items():
        if keyword in combined and link_info["url"] not in seen_urls:
            links.append({"label": link_info["label"], "url": link_info["url"]})
            seen_urls.add(link_info["url"])

    return links[:5]


def ask_question(
    client: Client,
    user_id: str,
    question: str,
) -> dict:
    """AI Q&A: 컨텍스트 수집 → AI 답변 → 딥링크 생성 → DB 저장."""
    context = _build_context(client, question)
    model = _get_model_from_db(client)

    if not settings.openrouter_api_key:
        logger.warning("OPENROUTER_API_KEY not set — returning fallback answer")
        answer = (
            "AI 답변 기능이 아직 활성화되지 않았습니다. "
            "관리자에게 OpenRouter API 키 설정을 요청해 주세요."
        )
        deeplinks = _extract_deeplinks(question, answer)
        _save_conversation(client, user_id, question, answer, context, deeplinks)
        return {"answer": answer, "deeplinks": deeplinks, "context_data": context}

    context_json = json.dumps(context, ensure_ascii=False, default=str)

    prompt = f"""당신은 주식 투자 AI 어시스턴트 "Stock Guide"입니다.
초보 투자자도 이해할 수 있도록 쉽고 친절하게 답변하세요.

## 현재 시장 데이터
{context_json}

## 사용자 질문
{question}

## 답변 규칙
1. 한국어로 답변하세요.
2. 구체적 데이터(수치, 지표)를 인용하여 근거를 제시하세요.
3. 투자 권유가 아닌 정보 제공임을 명시하세요.
4. 초보자가 이해하기 쉬운 용어를 사용하세요.
5. 3~8문장으로 간결하게 답변하세요.

답변만 작성하세요."""

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
                "temperature": 0.5,
            },
            timeout=60.0,
        )
        response.raise_for_status()
        answer = response.json()["choices"][0]["message"]["content"].strip()

    except Exception as e:
        logger.error("AI Q&A failed: %s", e)
        answer = (
            "죄송합니다. 일시적으로 AI 답변을 생성할 수 없습니다. "
            "잠시 후 다시 시도해 주세요."
        )

    deeplinks = _extract_deeplinks(question, answer)
    _save_conversation(client, user_id, question, answer, context, deeplinks)

    return {"answer": answer, "deeplinks": deeplinks, "context_data": context}


def _save_conversation(
    client: Client,
    user_id: str,
    question: str,
    answer: str,
    context: dict,
    deeplinks: list[dict],
) -> None:
    """대화를 DB에 저장한다."""
    try:
        client.table("ai_conversations").insert(
            {
                "user_id": user_id,
                "question": question,
                "answer": answer,
                "context_data": context,
                "deeplinks": deeplinks,
            }
        ).execute()
        logger.info("Conversation saved for user %s", user_id)
    except Exception as e:
        logger.error("Failed to save conversation: %s", e)
