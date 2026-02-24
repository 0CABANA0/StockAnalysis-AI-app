"""RSS 뉴스 수집 + OpenRouter AI 감성 분석 서비스.

9개 카테고리 91개 키워드 기반 포괄적 뉴스 분석:
- 거시경제 & 금융, 지정학 & 국제정세, 기술 & 산업, 전력/에너지
- 국내 정치, 국제 정치 & 외교, 속보 & 재난, 경제 정책 & 규제, 생활 & 자산
"""

import json
from datetime import datetime, timezone

import feedparser
import httpx

from app.config import settings
from app.models.sentiment import (
    NewsCategoryConfig,
    NewsArticle,
    SentimentCollectResponse,
    SentimentResult,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

MAX_ARTICLES_PER_SOURCE = 10
DEFAULT_MODEL = "google/gemini-2.0-flash-001"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# ─── 9개 카테고리 정의 (DB news_categories 테이블과 동기화) ───

NEWS_CATEGORIES: dict[str, dict] = {
    "MACRO_FINANCE": {
        "display_name": "거시경제 & 금융",
        "keywords": [
            "AI", "주식", "기준금리", "금리인상", "금리인하", "환율", "인플레이션",
            "코스피", "나스닥", "S&P500", "국채", "ETF", "배당", "공매도",
            "interest rate", "inflation", "Fed", "FOMC", "GDP", "CPI",
        ],
        "feeds": {
            "Reuters Business": "https://feeds.reuters.com/reuters/businessNews",
            "BBC Business": "https://feeds.bbci.co.uk/news/business/rss.xml",
            "한국경제": "https://www.hankyung.com/feed/all-news",
            "매일경제": "https://www.mk.co.kr/rss/30000001/",
        },
    },
    "GEOPOLITICS": {
        "display_name": "지정학 & 국제정세",
        "keywords": [
            "미중무역", "수출규제", "우크라이나", "중동", "북한미사일", "대만해협",
            "관세", "제재", "BRICS", "tariff", "trade war", "sanction",
            "Ukraine", "Taiwan", "Iran", "Israel", "Hamas",
        ],
        "feeds": {
            "Reuters World": "https://feeds.reuters.com/reuters/worldNews",
            "BBC World": "https://feeds.bbci.co.uk/news/world/rss.xml",
            "Al Jazeera": "https://www.aljazeera.com/xml/rss/all.xml",
        },
    },
    "TECH_INDUSTRY": {
        "display_name": "기술 & 산업",
        "keywords": [
            "반도체", "엔비디아", "삼성전자", "SK하이닉스", "테슬라", "챗GPT",
            "자율주행", "로봇", "2차전지", "바이오", "NVIDIA", "semiconductor",
            "chip", "AI chip", "EV", "battery", "biotech",
        ],
        "feeds": {
            "Reuters Tech": "https://feeds.reuters.com/reuters/technologyNews",
            "전자신문": "https://rss.etnews.com/Section901.xml",
        },
    },
    "ENERGY": {
        "display_name": "전력/에너지",
        "keywords": [
            "전력설비", "송전", "변압기", "원전", "신재생에너지", "전력난", "한전",
            "nuclear", "renewable", "solar", "wind power", "grid",
            "oil", "natural gas", "OPEC",
        ],
        "feeds": {
            "Reuters Energy": "https://feeds.reuters.com/reuters/USenergyNews",
        },
    },
    "DOMESTIC_POLITICS": {
        "display_name": "국내 정치",
        "keywords": [
            "대통령", "국회", "대선", "총선", "탄핵", "국무회의", "국정감사",
            "특검", "여야합의", "정당", "개각", "검찰", "헌법재판소",
        ],
        "feeds": {
            "연합뉴스 정치": "https://www.yna.co.kr/rss/politics.xml",
        },
    },
    "INTL_POLITICS": {
        "display_name": "국제 정치 & 외교",
        "keywords": [
            "한미정상", "한중관계", "한일관계", "G7", "G20", "UN", "NATO",
            "미국대선", "트럼프", "시진핑", "푸틴", "BRICS",
            "Trump", "Xi Jinping", "Putin", "summit",
        ],
        "feeds": {
            "Reuters World": "https://feeds.reuters.com/reuters/worldNews",
            "BBC World": "https://feeds.bbci.co.uk/news/world/rss.xml",
        },
    },
    "BREAKING_DISASTER": {
        "display_name": "속보 & 재난",
        "keywords": [
            "긴급속보", "비상", "속보", "계엄", "지진", "태풍", "산불", "폭우",
            "홍수", "정전", "테러", "전쟁", "사이버공격", "폭발",
            "breaking", "emergency", "earthquake", "typhoon", "war",
        ],
        "feeds": {
            "Reuters Top": "https://feeds.reuters.com/reuters/topNews",
            "BBC Breaking": "https://feeds.bbci.co.uk/news/rss.xml",
        },
    },
    "ECONOMIC_POLICY": {
        "display_name": "경제 정책 & 규제",
        "keywords": [
            "금투세", "양도세", "종부세", "상속세", "규제완화", "공정거래",
            "최저임금", "예산안", "tax", "regulation", "minimum wage",
        ],
        "feeds": {
            "한국경제": "https://www.hankyung.com/feed/all-news",
            "매일경제": "https://www.mk.co.kr/rss/30000001/",
        },
    },
    "LIFESTYLE_ASSET": {
        "display_name": "생활 & 자산",
        "keywords": [
            "부동산대책", "아파트", "연금", "세금", "금값", "물가", "건강보험",
            "real estate", "pension", "gold price", "CPI",
        ],
        "feeds": {
            "매일경제": "https://www.mk.co.kr/rss/30000001/",
        },
    },
}

# 모든 피드를 중복 없이 합산 (실제 수집 시 사용)
_ALL_FEEDS: dict[str, str] = {}
for _cat_data in NEWS_CATEGORIES.values():
    for _name, _url in _cat_data["feeds"].items():
        _ALL_FEEDS[_name] = _url


# ─── 뉴스 수집 ───


def collect_news() -> list[NewsArticle]:
    """확장된 RSS 피드에서 뉴스 기사를 수집한다."""
    articles: list[NewsArticle] = []

    for source, url in _ALL_FEEDS.items():
        try:
            feed = feedparser.parse(url)
            entries = feed.entries[:MAX_ARTICLES_PER_SOURCE]

            for entry in entries:
                published = entry.get("published", entry.get("updated", ""))
                articles.append(
                    NewsArticle(
                        title=entry.get("title", "").strip(),
                        link=entry.get("link", ""),
                        source=source,
                        published=published,
                    )
                )

            logger.info("Collected %d articles from %s", len(entries), source)
        except Exception as e:
            logger.warning("Failed to collect from %s: %s", source, e)

    logger.info("Total articles collected: %d", len(articles))
    return articles


def _classify_category(title: str) -> str | None:
    """키워드 매칭으로 뉴스 카테고리를 1차 분류한다 (AI 분류 전 사전 힌트)."""
    title_lower = title.lower()
    for cat_key, cat_data in NEWS_CATEGORIES.items():
        for kw in cat_data["keywords"]:
            if kw.lower() in title_lower:
                return cat_key
    return None


# ─── AI 감성 분석 ───


def _get_model_from_db(supabase_client) -> str:
    """model_configs 테이블에서 감성 분석용 모델을 조회한다."""
    try:
        result = (
            supabase_client.table("model_configs")
            .select("model_id")
            .eq("feature", "sentiment")
            .eq("is_active", True)
            .limit(1)
            .execute()
        )
        if result.data:
            return result.data[0]["model_id"]
    except Exception as e:
        logger.warning("Failed to query model_configs: %s — using default", e)

    return DEFAULT_MODEL


def _make_neutral_fallback(reason: str) -> dict:
    """API 실패 시 중립 기본값을 반환한다."""
    return {
        "direction": "NEUTRAL",
        "score": 0.0,
        "confidence": None,
        "event_type": None,
        "urgency": "LOW",
        "news_category": None,
        "reasoning": reason,
        "affected_sectors": [],
        "affected_countries": [],
        "short_term_impact": None,
        "medium_term_impact": None,
    }


def _build_category_prompt_section() -> str:
    """AI 프롬프트에 포함할 카테고리 목록 텍스트를 생성한다."""
    lines = []
    for key, data in NEWS_CATEGORIES.items():
        kw_sample = ", ".join(data["keywords"][:6])
        lines.append(f'  - "{key}": {data["display_name"]} (키워드: {kw_sample}...)')
    return "\n".join(lines)


def _analyze_batch(
    articles: list[NewsArticle],
    model: str,
) -> list[dict]:
    """OpenRouter API로 뉴스 배치 감성 분석 + 카테고리 분류를 수행한다."""
    if not settings.openrouter_api_key:
        logger.warning("OPENROUTER_API_KEY not set — returning neutral scores")
        # API 키 없으면 키워드 매칭 기반 카테고리만 설정
        results = []
        for a in articles:
            fallback = _make_neutral_fallback("API 키 미설정")
            fallback["news_category"] = _classify_category(a.title)
            results.append(fallback)
        return results

    titles = [f"{i + 1}. [{a.source}] {a.title}" for i, a in enumerate(articles)]
    titles_text = "\n".join(titles)
    categories_text = _build_category_prompt_section()

    prompt = f"""다음 뉴스 헤드라인들의 시장 감성을 분석하고 카테고리를 분류하세요.

{titles_text}

## 카테고리 목록
{categories_text}

각 헤드라인에 대해 JSON 배열로 응답하세요. 각 항목:
- "direction": "BULLISH", "BEARISH", "NEUTRAL" 중 하나
- "score": -1.0(매우 부정) ~ 1.0(매우 긍정) 사이 실수
- "confidence": 0.0 ~ 1.0 사이 신뢰도
- "event_type": "GEOPOLITICAL", "ECONOMIC", "CURRENCY", "REGULATORY", "NATURAL" 중 하나 또는 null
- "urgency": "LOW", "MEDIUM", "HIGH" 중 하나
- "news_category": 위 카테고리 목록의 키 중 가장 관련 있는 것 하나 (예: "MACRO_FINANCE"). 해당 없으면 null
- "reasoning": 한국어 한 줄 분석 근거 (30자 이내)
- "affected_sectors": 영향 받는 섹터 배열 (예: ["반도체", "자동차"]) 또는 []
- "affected_countries": 영향 받는 국가 배열 (예: ["한국", "미국"]) 또는 []
- "short_term_impact": 단기(1주) 영향 한 줄 요약 또는 null
- "medium_term_impact": 중기(1~3개월) 영향 한 줄 요약 또는 null

JSON 배열만 응답하세요. 다른 텍스트는 포함하지 마세요."""

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

        scores = json.loads(content)

        results: list[dict] = []
        for i, article in enumerate(articles):
            if i < len(scores):
                s = scores[i]
                # AI가 반환한 카테고리 검증, 유효하지 않으면 키워드 매칭 폴백
                ai_category = s.get("news_category")
                if ai_category not in NEWS_CATEGORIES:
                    ai_category = _classify_category(article.title)

                results.append(
                    {
                        "direction": s.get("direction", "NEUTRAL"),
                        "score": float(s.get("score", 0.0)),
                        "confidence": s.get("confidence"),
                        "event_type": s.get("event_type"),
                        "urgency": s.get("urgency", "LOW"),
                        "news_category": ai_category,
                        "reasoning": s.get("reasoning"),
                        "affected_sectors": s.get("affected_sectors", []),
                        "affected_countries": s.get("affected_countries", []),
                        "short_term_impact": s.get("short_term_impact"),
                        "medium_term_impact": s.get("medium_term_impact"),
                    }
                )
            else:
                fallback = _make_neutral_fallback("분석 누락")
                fallback["news_category"] = _classify_category(article.title)
                results.append(fallback)

        return results

    except Exception as e:
        logger.error("OpenRouter sentiment analysis failed: %s", e)
        results = []
        for a in articles:
            fallback = _make_neutral_fallback("분석 실패")
            fallback["news_category"] = _classify_category(a.title)
            results.append(fallback)
        return results


# ─── DB 저장/조회 ───


def _save_results(
    supabase_client,
    articles: list[NewsArticle],
    analyses: list[dict],
    analyzed_at: datetime,
) -> int:
    """감성 분석 결과를 DB에 저장한다."""
    rows = []
    for article, analysis in zip(articles, analyses):
        rows.append(
            {
                "source_url": article.link,
                "source_title": article.title,
                "score": analysis["score"],
                "direction": analysis["direction"],
                "confidence": analysis.get("confidence"),
                "event_type": analysis.get("event_type"),
                "urgency": analysis.get("urgency", "LOW"),
                "news_category": analysis.get("news_category"),
                "reasoning": analysis.get("reasoning"),
                "affected_sectors": analysis.get("affected_sectors"),
                "affected_countries": analysis.get("affected_countries"),
                "short_term_impact": analysis.get("short_term_impact"),
                "medium_term_impact": analysis.get("medium_term_impact"),
                "analyzed_at": analyzed_at.isoformat(),
            }
        )

    try:
        result = (
            supabase_client.table("sentiment_results").insert(rows).execute()
        )
        saved = len(result.data)
        logger.info("Saved %d sentiment results to DB", saved)
        return saved
    except Exception as e:
        logger.error("Failed to save sentiment results: %s", e)
        return 0


def get_results(
    supabase_client,
    limit: int = 20,
    offset: int = 0,
    news_category: str | None = None,
) -> tuple[list[SentimentResult], int]:
    """감성 분석 결과를 페이지네이션으로 조회한다."""
    # 전체 개수
    count_query = (
        supabase_client.table("sentiment_results")
        .select("id", count="exact")
    )
    if news_category:
        count_query = count_query.eq("news_category", news_category)
    count_result = count_query.execute()
    total = count_result.count or 0

    # 데이터 조회
    data_query = (
        supabase_client.table("sentiment_results")
        .select("*")
        .order("analyzed_at", desc=True)
    )
    if news_category:
        data_query = data_query.eq("news_category", news_category)
    result = data_query.range(offset, offset + limit - 1).execute()

    results = [_row_to_result(row) for row in result.data]
    return results, total


def get_categories(supabase_client) -> list[NewsCategoryConfig]:
    """DB에서 뉴스 카테고리 설정 목록을 조회한다."""
    try:
        result = (
            supabase_client.table("news_categories")
            .select("category_key, display_name, description, keywords, is_active, sort_order")
            .eq("is_active", True)
            .order("sort_order")
            .execute()
        )
        return [
            NewsCategoryConfig(
                category_key=row["category_key"],
                display_name=row["display_name"],
                description=row.get("description"),
                keywords=row.get("keywords", []),
                is_active=row.get("is_active", True),
                sort_order=row.get("sort_order", 0),
            )
            for row in result.data
        ]
    except Exception as e:
        logger.warning("Failed to fetch news_categories: %s — using defaults", e)
        # DB 실패 시 하드코딩된 카테고리에서 반환
        return [
            NewsCategoryConfig(
                category_key=key,
                display_name=data["display_name"],
                keywords=data["keywords"],
                sort_order=i,
            )
            for i, (key, data) in enumerate(NEWS_CATEGORIES.items())
        ]


def get_category_summary(
    supabase_client,
) -> list[dict]:
    """카테고리별 최근 분석 요약 통계를 반환한다."""
    try:
        # 최근 24시간 기준 카테고리별 집계
        result = (
            supabase_client.table("sentiment_results")
            .select("news_category, direction, score")
            .not_.is_("news_category", "null")
            .order("analyzed_at", desc=True)
            .limit(500)
            .execute()
        )

        # 카테고리별 집계
        cat_stats: dict[str, dict] = {}
        for row in result.data:
            cat = row["news_category"]
            if cat not in cat_stats:
                cat_stats[cat] = {
                    "category_key": cat,
                    "total": 0,
                    "bullish": 0,
                    "bearish": 0,
                    "neutral": 0,
                    "avg_score": 0.0,
                    "scores": [],
                }
            stats = cat_stats[cat]
            stats["total"] += 1
            direction = row.get("direction", "NEUTRAL")
            if direction == "BULLISH":
                stats["bullish"] += 1
            elif direction == "BEARISH":
                stats["bearish"] += 1
            else:
                stats["neutral"] += 1
            stats["scores"].append(float(row.get("score", 0.0)))

        # 평균 점수 계산 + display_name 매핑
        summaries = []
        for cat_key, stats in cat_stats.items():
            cat_info = NEWS_CATEGORIES.get(cat_key, {})
            avg = sum(stats["scores"]) / len(stats["scores"]) if stats["scores"] else 0.0
            summaries.append({
                "category_key": cat_key,
                "display_name": cat_info.get("display_name", cat_key),
                "total": stats["total"],
                "bullish": stats["bullish"],
                "bearish": stats["bearish"],
                "neutral": stats["neutral"],
                "avg_score": round(avg, 3),
            })

        # sort_order 기준 정렬
        cat_order = {k: i for i, k in enumerate(NEWS_CATEGORIES)}
        summaries.sort(key=lambda x: cat_order.get(x["category_key"], 99))
        return summaries

    except Exception as e:
        logger.error("Failed to compute category summary: %s", e)
        return []


def _row_to_result(row: dict) -> SentimentResult:
    """DB row를 SentimentResult로 변환한다 (플랫 매핑)."""
    return SentimentResult(
        id=row.get("id"),
        source_url=row.get("source_url"),
        source_title=row.get("source_title"),
        score=float(row.get("score", 0.0)),
        direction=row.get("direction", "NEUTRAL"),
        confidence=row.get("confidence"),
        event_type=row.get("event_type"),
        urgency=row.get("urgency", "LOW"),
        news_category=row.get("news_category"),
        reasoning=row.get("reasoning"),
        affected_sectors=row.get("affected_sectors"),
        affected_countries=row.get("affected_countries"),
        short_term_impact=row.get("short_term_impact"),
        medium_term_impact=row.get("medium_term_impact"),
        analyzed_at=row.get("analyzed_at"),
        created_at=row.get("created_at"),
    )


# ─── 통합 수집+분석 ───


def collect_and_analyze(supabase_client) -> SentimentCollectResponse:
    """뉴스 수집 → AI 감성 분석 + 카테고리 분류 → DB 저장까지 수행한다."""
    analyzed_at = datetime.now(timezone.utc)

    # 1. 뉴스 수집 (확장된 9개 카테고리 RSS 피드)
    articles = collect_news()
    if not articles:
        return SentimentCollectResponse(
            success=False,
            articles_collected=0,
            articles_analyzed=0,
            collected_at=analyzed_at,
        )

    # 2. 모델 선택
    model = _get_model_from_db(supabase_client)
    logger.info("Using model: %s", model)

    # 3. 배치 분석 (10건씩 나눠서 — 카테고리 분류 포함)
    batch_size = 10
    all_analyses: list[dict] = []
    for i in range(0, len(articles), batch_size):
        batch = articles[i : i + batch_size]
        analyses = _analyze_batch(batch, model)
        all_analyses.extend(analyses)

    # 4. DB 저장
    saved = _save_results(supabase_client, articles, all_analyses, analyzed_at)

    return SentimentCollectResponse(
        success=True,
        articles_collected=len(articles),
        articles_analyzed=saved,
        collected_at=analyzed_at,
    )
