"""RSS 뉴스 수집 + OpenRouter AI 감성 분석 서비스."""

import json
from datetime import datetime, timezone

import feedparser
import httpx

from app.config import settings
from app.models.sentiment import (
    NewsArticle,
    SentimentCollectResponse,
    SentimentResult,
    SentimentScore,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

# RSS 피드 소스
RSS_FEEDS: dict[str, str] = {
    "Reuters": "https://feeds.reuters.com/reuters/businessNews",
    "BBC Business": "https://feeds.bbci.co.uk/news/business/rss.xml",
    "한국경제": "https://www.hankyung.com/feed/all-news",
    "매일경제": "https://www.mk.co.kr/rss/30000001/",
}

MAX_ARTICLES_PER_SOURCE = 10
DEFAULT_MODEL = "google/gemini-2.0-flash-001"
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


# ─── 뉴스 수집 ───


def collect_news() -> list[NewsArticle]:
    """RSS 피드에서 뉴스 기사를 수집한다."""
    articles: list[NewsArticle] = []

    for source, url in RSS_FEEDS.items():
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


def _analyze_batch(
    articles: list[NewsArticle],
    model: str,
) -> list[SentimentScore]:
    """OpenRouter API로 뉴스 배치 감성 분석을 수행한다."""
    if not settings.openrouter_api_key:
        logger.warning("OPENROUTER_API_KEY not set — returning neutral scores")
        return [
            SentimentScore(label="neutral", score=0.0, summary="API 키 미설정")
            for _ in articles
        ]

    titles = [f"{i + 1}. [{a.source}] {a.title}" for i, a in enumerate(articles)]
    titles_text = "\n".join(titles)

    prompt = f"""다음 뉴스 헤드라인들의 시장 감성을 분석하세요.

{titles_text}

각 헤드라인에 대해 JSON 배열로 응답하세요. 각 항목:
- "label": "positive", "negative", "neutral" 중 하나
- "score": -1.0(매우 부정) ~ 1.0(매우 긍정) 사이 실수
- "summary": 한국어 한 줄 요약 (20자 이내)

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

        results: list[SentimentScore] = []
        for i, article in enumerate(articles):
            if i < len(scores):
                s = scores[i]
                results.append(
                    SentimentScore(
                        label=s.get("label", "neutral"),
                        score=float(s.get("score", 0.0)),
                        summary=s.get("summary", ""),
                    )
                )
            else:
                results.append(
                    SentimentScore(
                        label="neutral", score=0.0, summary="분석 누락"
                    )
                )

        return results

    except Exception as e:
        logger.error("OpenRouter sentiment analysis failed: %s", e)
        return [
            SentimentScore(label="neutral", score=0.0, summary="분석 실패")
            for _ in articles
        ]


# ─── DB 저장/조회 ───


def _save_results(
    supabase_client,
    articles: list[NewsArticle],
    scores: list[SentimentScore],
    model: str,
    analyzed_at: datetime,
) -> int:
    """감성 분석 결과를 DB에 저장한다."""
    rows = []
    for article, score in zip(articles, scores):
        rows.append(
            {
                "article_title": article.title,
                "article_link": article.link,
                "article_source": article.source,
                "article_published": article.published,
                "sentiment_label": score.label,
                "sentiment_score": score.score,
                "sentiment_summary": score.summary,
                "model_used": model,
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
) -> tuple[list[SentimentResult], int]:
    """감성 분석 결과를 페이지네이션으로 조회한다."""
    # 전체 개수
    count_result = (
        supabase_client.table("sentiment_results")
        .select("id", count="exact")
        .execute()
    )
    total = count_result.count or 0

    # 데이터 조회
    result = (
        supabase_client.table("sentiment_results")
        .select("*")
        .order("analyzed_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )

    results = [_row_to_result(row) for row in result.data]
    return results, total


def _row_to_result(row: dict) -> SentimentResult:
    """DB row를 SentimentResult로 변환한다."""
    return SentimentResult(
        id=row.get("id"),
        article=NewsArticle(
            title=row.get("article_title", ""),
            link=row.get("article_link", ""),
            source=row.get("article_source", ""),
            published=row.get("article_published"),
        ),
        sentiment=SentimentScore(
            label=row.get("sentiment_label", "neutral"),
            score=float(row.get("sentiment_score", 0.0)),
            summary=row.get("sentiment_summary", ""),
        ),
        model_used=row.get("model_used", ""),
        analyzed_at=row.get("analyzed_at"),
        created_at=row.get("created_at"),
    )


# ─── 통합 수집+분석 ───


def collect_and_analyze(supabase_client) -> SentimentCollectResponse:
    """뉴스 수집 → AI 감성 분석 → DB 저장까지 수행한다."""
    analyzed_at = datetime.now(timezone.utc)

    # 1. 뉴스 수집
    articles = collect_news()
    if not articles:
        return SentimentCollectResponse(
            success=False,
            collected_count=0,
            analyzed_count=0,
            failed_count=0,
            model_used="",
            collected_at=analyzed_at,
        )

    # 2. 모델 선택
    model = _get_model_from_db(supabase_client)
    logger.info("Using model: %s", model)

    # 3. 배치 분석 (10건씩 나눠서)
    batch_size = 10
    all_scores: list[SentimentScore] = []
    for i in range(0, len(articles), batch_size):
        batch = articles[i : i + batch_size]
        scores = _analyze_batch(batch, model)
        all_scores.extend(scores)

    # 4. DB 저장
    saved = _save_results(supabase_client, articles, all_scores, model, analyzed_at)
    failed = len(articles) - saved

    return SentimentCollectResponse(
        success=True,
        collected_count=len(articles),
        analyzed_count=saved,
        failed_count=failed,
        model_used=model,
        collected_at=analyzed_at,
    )
