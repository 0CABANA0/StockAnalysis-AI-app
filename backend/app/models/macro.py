from datetime import datetime

from pydantic import BaseModel


# --- 수집 결과 내부 구조 ---


class ExchangeRates(BaseModel):
    usd_krw: float | None = None
    jpy_usd: float | None = None
    eur_usd: float | None = None
    cny_krw: float | None = None


class Commodities(BaseModel):
    wti: float | None = None
    gold: float | None = None
    copper: float | None = None
    natural_gas: float | None = None


class RatesAndFear(BaseModel):
    us_10y_yield: float | None = None
    vix: float | None = None


class GlobalIndices(BaseModel):
    sp500: float | None = None
    nasdaq: float | None = None
    kospi: float | None = None
    nikkei: float | None = None
    shanghai: float | None = None


class FredIndicators(BaseModel):
    """FRED 경제 지표 (선택적 — API 키 없으면 빈 값)."""

    fed_funds_rate: float | None = None  # DFF: 미국 기준금리
    treasury_spread: float | None = None  # T10Y2Y: 장단기 금리차
    breakeven_inflation: float | None = None  # T10YIE: 기대 인플레이션
    unemployment_rate: float | None = None  # UNRATE: 실업률
    high_yield_spread: float | None = None  # BAMLH0A0HYM2: 하이일드 스프레드


class EcosIndicators(BaseModel):
    """한국은행 ECOS 경제 지표 (선택적 — API 키 없으면 빈 값)."""

    bok_base_rate: float | None = None  # 한국 기준금리
    korea_treasury_3y: float | None = None  # 국고채 3년 수익률
    korea_cpi_yoy: float | None = None  # 소비자물가 전년동월비(%)


class SnapshotData(BaseModel):
    exchange_rates: ExchangeRates = ExchangeRates()
    commodities: Commodities = Commodities()
    rates_and_fear: RatesAndFear = RatesAndFear()
    global_indices: GlobalIndices = GlobalIndices()
    fred: FredIndicators = FredIndicators()
    ecos: EcosIndicators = EcosIndicators()


# --- API 응답 ---


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"
    timestamp: datetime


class MacroCollectResponse(BaseModel):
    success: bool
    collected_at: datetime
    snapshot: SnapshotData
    failed_tickers: list[str] = []


class MacroSnapshotResponse(BaseModel):
    id: str
    snapshot_data: SnapshotData
    usd_krw: float | None = None
    vix: float | None = None
    us_10y_yield: float | None = None
    wti: float | None = None
    gold: float | None = None
    collected_at: datetime
    created_at: datetime


class MacroHistoryResponse(BaseModel):
    snapshots: list[MacroSnapshotResponse]
    total: int
    limit: int
    offset: int
