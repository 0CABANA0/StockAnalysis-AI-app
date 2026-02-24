"""지정학 뉴스 RSS 수집 + OpenRouter AI 분류 서비스."""

import json
from datetime import datetime, timezone

import feedparser
import httpx
from supabase import Client

from app.config import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
DEFAULT_MODEL = "google/gemini-2.0-flash-001"

# 지정학 뉴스 RSS 피드
GEO_RSS_FEEDS: dict[str, str] = {
    "Reuters World": "https://feeds.reuters.com/reuters/worldNews",
    "BBC World": "https://feeds.bbci.co.uk/news/world/rss.xml",
    "Al Jazeera": "https://www.aljazeera.com/xml/rss/all.xml",
}

MAX_ARTICLES_PER_SOURCE = 15

# 8개 리스크 ID → 키워드 매핑 (DB monitoring_keywords와 동기화)
RISK_KEYWORDS: dict[str, list[str]] = {
    "us-china-trade": ["tariff", "trade war", "trade deal", "관세", "무역분쟁", "trade deficit"],
    "us-china-tech": ["chip ban", "semiconductor", "AI regulation", "tech war", "CHIPS Act", "Huawei"],
    "taiwan-strait": ["Taiwan", "strait", "Taiwan military", "대만", "PLA"],
    "russia-ukraine": ["Ukraine", "Russia", "NATO", "Crimea", "Zelensky", "Putin"],
    "middle-east": ["Israel", "Hamas", "Iran", "Gaza", "Houthi", "Hezbollah", "Yemen"],
    "north-korea": ["North Korea", "ICBM", "Pyongyang", "Kim Jong", "DPRK", "missile test"],
    "south-china-sea": ["South China Sea", "Philippines", "maritime", "Spratly", "ASEAN dispute"],
    "supply-chain": ["supply chain", "shipping", "logistics", "port congestion", "freight"],
}


# ─── 뉴스 수집 ───


def _collect_geo_news() -> list[dict]:
    """RSS 피드에서 지정학 관련 뉴스를 수집한다."""
    articles: list[dict] = []

    for source, url in GEO_RSS_FEEDS.items():
        try:
            feed = feedparser.parse(url)
            entries = feed.entries[:MAX_ARTICLES_PER_SOURCE]

            for entry in entries:
                articles.append(
                    {
                        "title": entry.get("title", "").strip(),
                        "link": entry.get("link", ""),
                        "source": source,
                        "summary": entry.get("summary", "")[:300],
                        "published": entry.get("published", entry.get("updated", "")),
                    }
                )

            logger.info("Collected %d geo articles from %s", len(entries), source)
        except Exception as e:
            logger.warning("Failed to collect from %s: %s", source, e)

    logger.info("Total geo articles collected: %d", len(articles))
    return articles


# ─── AI 분류 ───


def _get_model_from_db(client: Client) -> str:
    """model_configs에서 지정학 분석용 모델을 조회한다."""
    try:
        result = (
            client.table("model_configs")
            .select("model_id")
            .eq("feature", "geo")
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]["model_id"]
    except Exception as e:
        logger.warning("model_configs query failed: %s — using default", e)
    return DEFAULT_MODEL


def _classify_geo_events(
    client: Client,
    articles: list[dict],
    model: str,
) -> list[dict]:
    """OpenRouter AI로 뉴스를 8개 리스크에 매핑하고 이벤트를 생성한다."""
    if not settings.openrouter_api_key:
        logger.warning("OPENROUTER_API_KEY not set — skipping geo classification")
        return []

    risk_ids = list(RISK_KEYWORDS.keys())
    titles = [f"{i + 1}. [{a['source']}] {a['title']}" for i, a in enumerate(articles)]
    titles_text = "\n".join(titles)

    prompt = f"""다음 뉴스 헤드라인들을 분석하여 지정학 리스크와 매핑하세요.

리스크 ID 목록: {json.dumps(risk_ids)}

뉴스:
{titles_text}

각 뉴스에 대해 관련 리스크가 있는 경우만 JSON 배열로 응답하세요. 관련 없는 뉴스는 제외.
각 항목:
- "article_index": 뉴스 번호 (1부터)
- "risk_id": 위 리스크 ID 중 하나
- "event_title": 한국어 이벤트 제목 (30자 이내)
- "impact_assessment": 한국어 시장 영향 평가 (50자 이내)
- "severity_change": "UP", "DOWN", "STABLE" 중 하나

JSON 배열만 응답하세요."""

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
                "temperature": 0.1,
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

        events_raw = json.loads(content)

        # 이벤트 레코드 생성
        events: list[dict] = []
        analyzed_at = datetime.now(timezone.utc).isoformat()

        for ev in events_raw:
            idx = ev.get("article_index", 0) - 1
            if idx < 0 or idx >= len(articles):
                continue

            article = articles[idx]
            risk_id = ev.get("risk_id", "")
            if risk_id not in risk_ids:
                continue

            events.append(
                {
                    "risk_id": risk_id,
                    "event_title": ev.get("event_title", article["title"][:60]),
                    "event_description": article.get("summary", ""),
                    "source_url": article["link"],
                    "impact_assessment": ev.get("impact_assessment"),
                    "severity_change": ev.get("severity_change", "STABLE"),
                    "analyzed_at": analyzed_at,
                }
            )

        # DB 저장
        if events:
            client.table("geopolitical_events").insert(events).execute()
            logger.info("Saved %d geopolitical events", len(events))

        return events

    except Exception as e:
        logger.error("Geo classification failed: %s", e)
        return []


# ─── 리스크 레벨 업데이트 ───


def _update_risk_levels(client: Client, events: list[dict]) -> None:
    """최근 이벤트 빈도와 심각도에 따라 risk_level을 업데이트한다."""
    # risk_id별 이벤트 집계
    risk_counts: dict[str, dict] = {}
    for ev in events:
        rid = ev["risk_id"]
        if rid not in risk_counts:
            risk_counts[rid] = {"total": 0, "up": 0}
        risk_counts[rid]["total"] += 1
        if ev.get("severity_change") == "UP":
            risk_counts[rid]["up"] += 1

    for risk_id, counts in risk_counts.items():
        # 이벤트 5건 이상 또는 UP이 3건 이상이면 레벨 상향
        if counts["up"] >= 3 or counts["total"] >= 5:
            new_level = "HIGH"
        elif counts["up"] >= 1 or counts["total"] >= 3:
            new_level = "MODERATE"
        else:
            new_level = "LOW"

        try:
            # 현재 레벨 조회
            current = (
                client.table("geopolitical_risks")
                .select("risk_level")
                .eq("risk_id", risk_id)
                .single()
                .execute()
            )
            if current.data:
                current_level = current.data["risk_level"]
                # CRITICAL은 수동 관리만 가능
                if current_level == "CRITICAL":
                    continue
                # 레벨이 변경된 경우에만 업데이트
                if current_level != new_level:
                    client.table("geopolitical_risks").update(
                        {"risk_level": new_level}
                    ).eq("risk_id", risk_id).execute()
                    logger.info(
                        "Risk level updated: %s %s → %s",
                        risk_id,
                        current_level,
                        new_level,
                    )
        except Exception as e:
            logger.warning("Risk level update failed for %s: %s", risk_id, e)


# ─── 통합 수집+분석 ───


def collect_and_analyze(client: Client) -> dict:
    """뉴스 수집 → AI 분류 → 리스크 레벨 업데이트."""
    # 1. 뉴스 수집
    articles = _collect_geo_news()
    if not articles:
        return {
            "success": False,
            "articles_collected": 0,
            "events_created": 0,
        }

    # 2. 모델 선택
    model = _get_model_from_db(client)
    logger.info("Using model for geo: %s", model)

    # 3. AI 분류 + 이벤트 저장
    events = _classify_geo_events(client, articles, model)

    # 4. 리스크 레벨 업데이트
    if events:
        _update_risk_levels(client, events)

    return {
        "success": True,
        "articles_collected": len(articles),
        "events_created": len(events),
    }
