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


class SnapshotData(BaseModel):
    exchange_rates: ExchangeRates = ExchangeRates()
    commodities: Commodities = Commodities()
    rates_and_fear: RatesAndFear = RatesAndFear()
    global_indices: GlobalIndices = GlobalIndices()


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
