"""ETF/펀드 데이터 동기화 + 거시-ETF 추천 서비스."""

from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

import yfinance as yf
from supabase import Client

from app.config import settings
from app.models.etf import (
    EtfFundMasterResponse,
    EtfSyncResponse,
    MacroEtfSuggestion,
    MacroEtfSuggestionsResponse,
)
from app.services.stock_service import _retry_yf_call
from app.services.supabase_client import get_latest
from app.utils.logger import get_logger

logger = get_logger(__name__)

# FinanceDataReader — import 실패 시 graceful skip
try:
    import FinanceDataReader as fdr

    FDR_AVAILABLE = True
except ImportError:
    FDR_AVAILABLE = False
    logger.warning("FinanceDataReader not installed — domestic ETF sync disabled")


TABLE = "etf_fund_master"
MAPPING_TABLE = "etf_macro_mapping"
MAX_WORKERS = 8

# 15개 해외 ETF 딕셔너리
FOREIGN_ETFS: dict[str, dict] = {
    "SPY": {"name": "SPDR S&P 500 ETF", "category": "US Large Cap"},
    "QQQ": {"name": "Invesco QQQ Trust", "category": "US Tech"},
    "TLT": {"name": "iShares 20+ Year Treasury", "category": "US Bond"},
    "GLD": {"name": "SPDR Gold Shares", "category": "Commodity"},
    "IWM": {"name": "iShares Russell 2000", "category": "US Small Cap"},
    "EFA": {"name": "iShares MSCI EAFE", "category": "Developed Market"},
    "EEM": {"name": "iShares MSCI Emerging", "category": "Emerging Market"},
    "VNQ": {"name": "Vanguard Real Estate", "category": "Real Estate"},
    "HYG": {"name": "iShares High Yield Corp Bond", "category": "High Yield Bond"},
    "LQD": {"name": "iShares Investment Grade Corp Bond", "category": "Corp Bond"},
    "DIA": {"name": "SPDR Dow Jones ETF", "category": "US Large Cap"},
    "SOXX": {"name": "iShares Semiconductor", "category": "Semiconductor"},
    "XLF": {"name": "Financial Select Sector SPDR", "category": "Financials"},
    "XLE": {"name": "Energy Select Sector SPDR", "category": "Energy"},
    "ARKK": {"name": "ARK Innovation ETF", "category": "Innovation"},
}

# 국내 ETF 시리즈 필터
DOMESTIC_SERIES = ("KODEX", "TIGER", "KBSTAR", "ARIRANG", "HANARO")


# ─── (A) 해외 ETF 동기화 ───


def _fetch_foreign_etf(ticker: str, meta: dict) -> dict | None:
    """단일 해외 ETF의 yfinance 정보를 수집한다."""
    try:
        t = yf.Ticker(ticker)
        info = _retry_yf_call(lambda: t.info)

        nav = info.get("navPrice") or info.get("previousClose")
        ter = info.get("annualReportExpenseRatio")
        aum = info.get("totalAssets")

        return {
            "ticker": ticker,
            "name": meta["name"],
            "asset_type": "ETF_US",
            "category": meta["category"],
            "nav": float(nav) if nav else None,
            "ter": round(float(ter) * 100, 4) if ter else None,
            "aum": float(aum) if aum else None,
            "currency": "USD",
            "description": info.get("longBusinessSummary", "")[:500],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        logger.error("Foreign ETF fetch failed for %s: %s", ticker, e)
        return None


def sync_foreign_etfs(client: Client) -> tuple[int, list[str]]:
    """15개 해외 ETF를 yfinance에서 병렬 수집하여 DB에 upsert한다."""
    results: list[dict] = []
    failed: list[str] = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_map = {
            executor.submit(_fetch_foreign_etf, ticker, meta): ticker
            for ticker, meta in FOREIGN_ETFS.items()
        }
        for future in as_completed(future_map):
            ticker = future_map[future]
            try:
                data = future.result()
                if data:
                    results.append(data)
                else:
                    failed.append(ticker)
            except Exception as e:
                logger.error("Foreign ETF thread failed for %s: %s", ticker, e)
                failed.append(ticker)

    # Upsert: select → update or insert
    count = 0
    for data in results:
        try:
            existing = (
                client.table(TABLE)
                .select("id")
                .eq("ticker", data["ticker"])
                .execute()
            )
            if existing.data:
                client.table(TABLE).update(data).eq("ticker", data["ticker"]).execute()
            else:
                data["created_at"] = datetime.now(timezone.utc).isoformat()
                client.table(TABLE).insert(data).execute()
            count += 1
        except Exception as e:
            logger.error("Foreign ETF upsert failed for %s: %s", data["ticker"], e)
            failed.append(data["ticker"])

    logger.info("Foreign ETF sync done: %d synced, %d failed", count, len(failed))
    return count, failed


# ─── (B) 국내 ETF 동기화 ───


def _classify_domestic_category(name: str) -> str:
    """ETF 이름 기반 카테고리 자동 분류."""
    name_upper = name.upper()
    if any(k in name_upper for k in ("코스피", "KOSPI", "200")):
        return "KR Large Cap"
    if any(k in name_upper for k in ("코스닥", "KOSDAQ")):
        return "KR Small Cap"
    if any(k in name_upper for k in ("반도체", "SEMI")):
        return "Semiconductor"
    if any(k in name_upper for k in ("2차전지", "배터리", "BATTERY")):
        return "Battery"
    if any(k in name_upper for k in ("미국", "S&P", "나스닥", "NASDAQ")):
        return "US Index"
    if any(k in name_upper for k in ("채권", "국채", "BOND")):
        return "KR Bond"
    if any(k in name_upper for k in ("금", "GOLD")):
        return "Commodity"
    if any(k in name_upper for k in ("원유", "WTI", "OIL")):
        return "Energy"
    if any(k in name_upper for k in ("리츠", "부동산", "REIT")):
        return "Real Estate"
    return "KR Other"


def sync_domestic_etfs(client: Client) -> tuple[int, list[str]]:
    """FinanceDataReader로 한국 ETF 목록을 수집한다."""
    if not FDR_AVAILABLE:
        logger.info("FDR not available — skipping domestic ETF sync")
        return 0, []

    failed: list[str] = []
    count = 0

    try:
        df = fdr.StockListing("ETF/KR")
        if df is None or df.empty:
            logger.warning("No domestic ETF data from FDR")
            return 0, []

        # 주요 시리즈 필터링
        name_col = "Name" if "Name" in df.columns else df.columns[1]
        code_col = "Code" if "Code" in df.columns else df.columns[0]
        close_col = "Close" if "Close" in df.columns else None

        filtered = df[
            df[name_col].str.startswith(DOMESTIC_SERIES, na=False)
        ].head(50)  # 상위 50개로 제한

        for _, row in filtered.iterrows():
            ticker = str(row[code_col])
            name = str(row[name_col])
            nav = float(row[close_col]) if close_col and row.get(close_col) else None

            data = {
                "ticker": ticker,
                "name": name,
                "asset_type": "ETF_KR",
                "category": _classify_domestic_category(name),
                "nav": nav,
                "currency": "KRW",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }

            try:
                existing = (
                    client.table(TABLE)
                    .select("id")
                    .eq("ticker", ticker)
                    .execute()
                )
                if existing.data:
                    client.table(TABLE).update(data).eq("ticker", ticker).execute()
                else:
                    data["created_at"] = datetime.now(timezone.utc).isoformat()
                    client.table(TABLE).insert(data).execute()
                count += 1
            except Exception as e:
                logger.error("Domestic ETF upsert failed for %s: %s", ticker, e)
                failed.append(ticker)

    except Exception as e:
        logger.error("Domestic ETF sync failed: %s", e)

    logger.info("Domestic ETF sync done: %d synced, %d failed", count, len(failed))
    return count, failed


# ─── (C) 국내 펀드 동기화 (Phase 2) ───


def sync_domestic_funds(client: Client) -> tuple[int, list[str]]:
    """KOFIA API로 국내 펀드를 수집한다. Phase 1에서는 기본 구조만."""
    if not settings.kofia_api_key:
        logger.info("KOFIA API key not set — skipping fund sync (Phase 2)")
        return 0, []

    # Phase 2: 실제 KOFIA API 호출 구현 예정
    logger.info("KOFIA fund sync — Phase 2 placeholder")
    return 0, []


# ─── (D) 전체 동기화 ───


def sync_all(client: Client) -> EtfSyncResponse:
    """해외 ETF + 국내 ETF + 펀드를 순차 동기화한다."""
    now = datetime.now(timezone.utc)

    foreign_count, foreign_failed = sync_foreign_etfs(client)
    domestic_count, domestic_failed = sync_domestic_etfs(client)
    fund_count, fund_failed = sync_domestic_funds(client)

    all_failed = foreign_failed + domestic_failed + fund_failed
    total = foreign_count + domestic_count + fund_count

    logger.info(
        "ETF sync_all done — foreign=%d, domestic=%d, fund=%d, failed=%d",
        foreign_count, domestic_count, fund_count, len(all_failed),
    )

    return EtfSyncResponse(
        domestic_count=domestic_count,
        foreign_count=foreign_count,
        fund_count=fund_count,
        total_count=total,
        failed_tickers=all_failed,
        synced_at=now,
    )


# ─── (E) 목록 조회 ───


def list_etf_funds(
    client: Client,
    asset_type: str | None = None,
    category: str | None = None,
    min_aum: float | None = None,
    sort_by: str = "name",
    sort_desc: bool = False,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[EtfFundMasterResponse], int]:
    """ETF/펀드 필터링 + 정렬 + 페이지네이션 목록을 반환한다."""
    # 전체 개수
    count_query = client.table(TABLE).select("id", count="exact")
    if asset_type:
        count_query = count_query.eq("asset_type", asset_type)
    if category:
        count_query = count_query.eq("category", category)
    if min_aum is not None:
        count_query = count_query.gte("aum", min_aum)
    count_result = count_query.execute()
    total = count_result.count or 0

    # 데이터 조회
    query = client.table(TABLE).select("*")
    if asset_type:
        query = query.eq("asset_type", asset_type)
    if category:
        query = query.eq("category", category)
    if min_aum is not None:
        query = query.gte("aum", min_aum)

    query = query.order(sort_by, desc=sort_desc)
    query = query.range(offset, offset + limit - 1)

    result = query.execute()
    items = [_to_master_response(row) for row in (result.data or [])]

    return items, total


# ─── (F) 상세 조회 ───


def get_by_ticker(client: Client, ticker: str) -> EtfFundMasterResponse | None:
    """ticker로 ETF/펀드 상세 정보를 반환한다."""
    result = (
        client.table(TABLE)
        .select("*")
        .eq("ticker", ticker)
        .limit(1)
        .execute()
    )
    if not result.data:
        return None
    return _to_master_response(result.data[0])


# ─── (G) 거시-ETF 추천 ───


def get_macro_etf_suggestions(
    client: Client,
) -> MacroEtfSuggestionsResponse:
    """최신 거시 스냅샷 기반으로 ETF 추천을 생성한다."""
    now = datetime.now(timezone.utc)

    # 최신 거시 스냅샷
    latest = get_latest(client)
    macro_context: dict = {}
    vix: float | None = None
    usd_krw: float | None = None
    wti: float | None = None

    if latest:
        macro_context = {
            "vix": latest.vix,
            "usd_krw": latest.usd_krw,
            "wti": latest.wti,
            "gold": latest.gold,
            "us_10y_yield": latest.us_10y_yield,
        }
        vix = latest.vix
        usd_krw = latest.usd_krw
        wti = latest.wti

    # etf_macro_mapping 전체 조회
    mapping_result = client.table(MAPPING_TABLE).select("*").execute()
    mappings = mapping_result.data or []

    suggestions: list[MacroEtfSuggestion] = []
    for row in mappings:
        scenario = row.get("scenario", "")
        tickers = row.get("tickers", [])
        rationale = row.get("rationale", "")

        # 규칙 기반 relevance_score 계산
        score = _calc_relevance_score(scenario, vix, usd_krw, wti)

        suggestions.append(
            MacroEtfSuggestion(
                scenario=scenario,
                tickers=tickers if isinstance(tickers, list) else [],
                rationale=rationale,
                relevance_score=round(score, 2),
            )
        )

    # relevance_score 내림차순 정렬
    suggestions.sort(key=lambda s: s.relevance_score, reverse=True)

    return MacroEtfSuggestionsResponse(
        suggestions=suggestions,
        macro_context=macro_context,
        generated_at=now,
    )


def _calc_relevance_score(
    scenario: str,
    vix: float | None,
    usd_krw: float | None,
    wti: float | None,
) -> float:
    """시나리오별 거시 지표 기반 relevance score를 계산한다."""
    score = 50.0  # 기본 점수
    scenario_lower = scenario.lower()

    # VIX 기반
    if vix is not None:
        if "vix" in scenario_lower or "변동성" in scenario_lower or "공포" in scenario_lower:
            if vix >= 30:
                score += 40
            elif vix >= 25:
                score += 25
            elif vix >= 20:
                score += 10
        if "안전자산" in scenario_lower or "safe" in scenario_lower:
            if vix >= 25:
                score += 30

    # USD/KRW 기반
    if usd_krw is not None:
        if "원화" in scenario_lower or "환율" in scenario_lower or "달러" in scenario_lower:
            if usd_krw >= 1400:
                score += 40
            elif usd_krw >= 1350:
                score += 25
            elif usd_krw >= 1300:
                score += 10

    # WTI 기반
    if wti is not None:
        if "원자재" in scenario_lower or "에너지" in scenario_lower or "유가" in scenario_lower:
            if wti >= 90:
                score += 40
            elif wti >= 80:
                score += 25
            elif wti >= 70:
                score += 10

    return min(score, 100.0)


# ─── (H) 카테고리 목록 ───


def get_distinct_categories(client: Client) -> list[str]:
    """etf_fund_master에서 고유 카테고리 목록을 반환한다."""
    result = client.table(TABLE).select("category").execute()
    categories = {row["category"] for row in (result.data or []) if row.get("category")}
    return sorted(categories)


# ─── 내부 헬퍼 ───


def _to_master_response(row: dict) -> EtfFundMasterResponse:
    """DB row를 EtfFundMasterResponse로 변환한다."""
    return EtfFundMasterResponse(
        id=row["id"],
        ticker=row.get("ticker", ""),
        name=row.get("name", ""),
        asset_type=row.get("asset_type", ""),
        category=row.get("category", ""),
        nav=row.get("nav"),
        ter=row.get("ter"),
        aum=row.get("aum"),
        currency=row.get("currency", "KRW"),
        description=row.get("description", ""),
        created_at=row.get("created_at"),
        updated_at=row.get("updated_at"),
    )
