"""주식 데이터 + 기술적 지표 Pydantic 모델."""

from datetime import datetime

from pydantic import BaseModel


# --- 캔들 데이터 ---


class CandleData(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class CandleResponse(BaseModel):
    ticker: str
    period: str
    interval: str
    candles: list[CandleData]
    count: int


# --- 기술적 지표 ---


class RSIData(BaseModel):
    value: float | None = None
    signal: str = ""


class MACDData(BaseModel):
    macd_line: float | None = None
    signal_line: float | None = None
    histogram: float | None = None
    signal: str = ""


class BollingerBands(BaseModel):
    upper: float | None = None
    middle: float | None = None
    lower: float | None = None
    signal: str = ""


class SMAData(BaseModel):
    sma_20: float | None = None
    sma_60: float | None = None
    sma_120: float | None = None
    signal: str = ""


class TechnicalIndicators(BaseModel):
    rsi: RSIData = RSIData()
    macd: MACDData = MACDData()
    bollinger_bands: BollingerBands = BollingerBands()
    sma: SMAData = SMAData()


class IndicatorResponse(BaseModel):
    ticker: str
    indicators: TechnicalIndicators
    calculated_at: datetime
    data_points: int


# --- 현재가 ---


class StockQuote(BaseModel):
    ticker: str
    price: float | None = None
    change: float | None = None
    change_percent: float | None = None
    volume: int | None = None
    name: str = ""
    fetched_at: datetime


class QuoteResponse(BaseModel):
    quotes: list[StockQuote]
    count: int
