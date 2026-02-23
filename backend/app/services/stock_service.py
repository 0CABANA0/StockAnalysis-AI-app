"""yfinance 기반 주식 데이터 수집 + 기술적 지표 계산 서비스."""

import math
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

import yfinance as yf

from app.models.stock import (
    BollingerBands,
    CandleData,
    CandleResponse,
    IndicatorResponse,
    MACDData,
    QuoteResponse,
    RSIData,
    SMAData,
    StockQuote,
    TechnicalIndicators,
)
from app.utils.logger import get_logger

logger = get_logger(__name__)

MAX_WORKERS = 8
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds


def _retry_yf_call(fn, *args, **kwargs):
    """yfinance 호출을 Rate Limit 시 재시도한다."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            if "RateLimit" in type(e).__name__ and attempt < MAX_RETRIES:
                wait = RETRY_DELAY * attempt
                logger.warning(
                    "Rate limited (attempt %d/%d), retrying in %ds...",
                    attempt, MAX_RETRIES, wait,
                )
                time.sleep(wait)
            else:
                raise


# ─── 캔들 데이터 ───


def fetch_candles(
    ticker: str,
    period: str = "6mo",
    interval: str = "1d",
) -> CandleResponse:
    """OHLCV 캔들 데이터를 가져온다."""
    t = yf.Ticker(ticker)
    hist = _retry_yf_call(t.history, period=period, interval=interval)

    candles: list[CandleData] = []
    for idx, row in hist.iterrows():
        candles.append(
            CandleData(
                date=idx.strftime("%Y-%m-%d"),
                open=round(float(row["Open"]), 2),
                high=round(float(row["High"]), 2),
                low=round(float(row["Low"]), 2),
                close=round(float(row["Close"]), 2),
                volume=int(row["Volume"]),
            )
        )

    return CandleResponse(
        ticker=ticker,
        period=period,
        interval=interval,
        candles=candles,
        count=len(candles),
    )


# ─── 기술적 지표 ───


def _calc_ema(values: list[float], period: int) -> list[float]:
    """EMA(지수이동평균)를 계산한다."""
    if len(values) < period:
        return []

    k = 2 / (period + 1)
    ema = [sum(values[:period]) / period]

    for price in values[period:]:
        ema.append(price * k + ema[-1] * (1 - k))

    return ema


def _calc_sma(values: list[float], period: int) -> list[float]:
    """SMA(단순이동평균)를 계산한다."""
    if len(values) < period:
        return []
    return [
        sum(values[i : i + period]) / period
        for i in range(len(values) - period + 1)
    ]


def _calc_rsi(closes: list[float], period: int = 14) -> RSIData:
    """RSI(14)를 Wilder's smoothing으로 계산한다."""
    if len(closes) < period + 1:
        return RSIData(signal="데이터 부족")

    deltas = [closes[i + 1] - closes[i] for i in range(len(closes) - 1)]
    gains = [d if d > 0 else 0.0 for d in deltas]
    losses = [-d if d < 0 else 0.0 for d in deltas]

    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period

    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period

    if avg_loss == 0:
        rsi = 100.0
    else:
        rs = avg_gain / avg_loss
        rsi = 100 - (100 / (1 + rs))

    rsi = round(rsi, 2)

    if rsi >= 70:
        signal = "과매수 구간 (매도 신호)"
    elif rsi <= 30:
        signal = "과매도 구간 (매수 신호)"
    else:
        signal = "중립 구간"

    return RSIData(value=rsi, signal=signal)


def _calc_macd(
    closes: list[float],
    fast: int = 12,
    slow: int = 26,
    signal_period: int = 9,
) -> MACDData:
    """MACD(12,26,9)를 계산한다."""
    if len(closes) < slow + signal_period:
        return MACDData(signal="데이터 부족")

    ema_fast = _calc_ema(closes, fast)
    ema_slow = _calc_ema(closes, slow)

    # EMA 길이 맞추기: slow EMA가 더 짧음
    offset = len(ema_fast) - len(ema_slow)
    macd_line = [
        ema_fast[offset + i] - ema_slow[i] for i in range(len(ema_slow))
    ]

    signal_line = _calc_ema(macd_line, signal_period)
    if not signal_line:
        return MACDData(signal="데이터 부족")

    current_macd = round(macd_line[-1], 4)
    current_signal = round(signal_line[-1], 4)
    histogram = round(current_macd - current_signal, 4)

    if current_macd > current_signal and histogram > 0:
        signal = "골든크로스 (매수 신호)"
    elif current_macd < current_signal and histogram < 0:
        signal = "데드크로스 (매도 신호)"
    else:
        signal = "중립"

    return MACDData(
        macd_line=current_macd,
        signal_line=current_signal,
        histogram=histogram,
        signal=signal,
    )


def _calc_bollinger(
    closes: list[float],
    period: int = 20,
    num_std: int = 2,
) -> BollingerBands:
    """볼린저 밴드(20,2)를 계산한다."""
    if len(closes) < period:
        return BollingerBands(signal="데이터 부족")

    window = closes[-period:]
    middle = sum(window) / period
    variance = sum((x - middle) ** 2 for x in window) / period
    std = math.sqrt(variance)

    upper = round(middle + num_std * std, 2)
    middle = round(middle, 2)
    lower = round(middle - num_std * std, 2)

    current = closes[-1]
    if current >= upper:
        signal = "상단 밴드 돌파 (과매수, 매도 신호)"
    elif current <= lower:
        signal = "하단 밴드 돌파 (과매도, 매수 신호)"
    else:
        signal = "밴드 내 정상 범위"

    return BollingerBands(
        upper=upper, middle=middle, lower=lower, signal=signal
    )


def _calc_sma_signals(closes: list[float]) -> SMAData:
    """SMA(20/60/120) 및 정배열/역배열 시그널."""
    sma_20 = _calc_sma(closes, 20)
    sma_60 = _calc_sma(closes, 60)
    sma_120 = _calc_sma(closes, 120)

    s20 = round(sma_20[-1], 2) if sma_20 else None
    s60 = round(sma_60[-1], 2) if sma_60 else None
    s120 = round(sma_120[-1], 2) if sma_120 else None

    if s20 is not None and s60 is not None and s120 is not None:
        if s20 > s60 > s120:
            signal = "정배열 (강한 상승 추세)"
        elif s20 < s60 < s120:
            signal = "역배열 (강한 하락 추세)"
        else:
            signal = "혼조세"
    elif s20 is not None and s60 is not None:
        if s20 > s60:
            signal = "단기 > 중기 (상승 추세)"
        else:
            signal = "단기 < 중기 (하락 추세)"
    else:
        signal = "데이터 부족"

    return SMAData(sma_20=s20, sma_60=s60, sma_120=s120, signal=signal)


def fetch_indicators(ticker: str) -> IndicatorResponse:
    """1년 일봉 기반으로 기술적 지표를 계산한다."""
    t = yf.Ticker(ticker)
    hist = _retry_yf_call(t.history, period="1y", interval="1d")
    closes = [float(row["Close"]) for _, row in hist.iterrows()]

    indicators = TechnicalIndicators(
        rsi=_calc_rsi(closes),
        macd=_calc_macd(closes),
        bollinger_bands=_calc_bollinger(closes),
        sma=_calc_sma_signals(closes),
    )

    return IndicatorResponse(
        ticker=ticker,
        indicators=indicators,
        calculated_at=datetime.now(timezone.utc),
        data_points=len(closes),
    )


# ─── 현재가 ───


def _fetch_single_quote(ticker: str) -> StockQuote:
    """단일 종목 현재가를 가져온다. fast_info 우선 → history fallback."""
    now = datetime.now(timezone.utc)
    t = yf.Ticker(ticker)

    price = None
    change = None
    change_percent = None
    volume = None
    name = ""

    # fast_info 시도
    try:
        fi = t.fast_info
        price = round(float(fi["lastPrice"]), 2) if fi.get("lastPrice") else None
        prev = fi.get("previousClose")
        if price and prev and prev > 0:
            change = round(price - float(prev), 2)
            change_percent = round((change / float(prev)) * 100, 2)
        volume = int(fi.get("lastVolume", 0)) or None
    except (KeyError, TypeError, AttributeError):
        pass

    # history fallback
    if price is None:
        try:
            hist = _retry_yf_call(t.history, period="5d")
            if not hist.empty:
                price = round(float(hist["Close"].iloc[-1]), 2)
                volume = int(hist["Volume"].iloc[-1])
                if len(hist) >= 2:
                    prev_close = float(hist["Close"].iloc[-2])
                    if prev_close > 0:
                        change = round(price - prev_close, 2)
                        change_percent = round(
                            (change / prev_close) * 100, 2
                        )
        except Exception as e:
            logger.warning("History fallback failed for %s: %s", ticker, e)

    # 종목명
    try:
        info = t.info
        name = info.get("shortName", "") or info.get("longName", "")
    except Exception:
        pass

    return StockQuote(
        ticker=ticker,
        price=price,
        change=change,
        change_percent=change_percent,
        volume=volume,
        name=name,
        fetched_at=now,
    )


def fetch_quote(ticker: str) -> StockQuote:
    """단일 종목 현재가 조회."""
    return _fetch_single_quote(ticker)


def fetch_multiple_quotes(tickers: list[str]) -> QuoteResponse:
    """여러 종목 현재가를 병렬 조회한다."""
    quotes: list[StockQuote] = []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_map = {
            executor.submit(_fetch_single_quote, t): t for t in tickers
        }
        for future in as_completed(future_map):
            ticker = future_map[future]
            try:
                quotes.append(future.result())
            except Exception as e:
                logger.error("Quote fetch failed for %s: %s", ticker, e)
                quotes.append(
                    StockQuote(
                        ticker=ticker,
                        fetched_at=datetime.now(timezone.utc),
                    )
                )

    return QuoteResponse(quotes=quotes, count=len(quotes))
