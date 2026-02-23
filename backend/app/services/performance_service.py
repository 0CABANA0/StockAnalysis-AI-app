"""성과 분석 서비스 — Sharpe Ratio, MDD, 롤링 수익률, 상관관계 행렬."""

import math
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

import numpy as np
import yfinance as yf

from app.models.etf import (
    CorrelationPair,
    PerformanceAnalysisResponse,
    PerformanceMetrics,
    RollingReturn,
)
from app.services.stock_service import _retry_yf_call
from app.utils.logger import get_logger

logger = get_logger(__name__)

MAX_WORKERS = 8
MIN_TRADING_DAYS = 20  # Sharpe 계산 최소 거래일


# ─── (A) 가격 시계열 수집 ───


def _fetch_price_series(
    ticker: str,
    period: str,
) -> tuple[str, np.ndarray | None, str]:
    """yfinance에서 종가 시계열을 수집한다.

    Returns:
        (ticker, prices_array_or_None, name)
    """
    try:
        t = yf.Ticker(ticker)
        hist = _retry_yf_call(t.history, period=period)

        if hist is None or hist.empty:
            return ticker, None, ""

        prices = hist["Close"].dropna().values.astype(np.float64)
        name = ""
        try:
            info = t.info
            name = info.get("shortName", "") or info.get("longName", "")
        except Exception:
            pass

        return ticker, prices, name
    except Exception as e:
        logger.error("Price fetch failed for %s: %s", ticker, e)
        return ticker, None, ""


# ─── (B) Sharpe Ratio ───


def _calc_sharpe(
    daily_returns: np.ndarray,
    risk_free_rate: float,
) -> float | None:
    """연율화 Sharpe Ratio를 계산한다.

    (mean_excess_return / std) * sqrt(252)
    최소 20 거래일 필요.
    """
    if len(daily_returns) < MIN_TRADING_DAYS:
        return None

    daily_rf = risk_free_rate / 252
    excess = daily_returns - daily_rf
    std = float(np.std(excess, ddof=1))

    if std == 0:
        return None

    sharpe = (float(np.mean(excess)) / std) * math.sqrt(252)
    return round(sharpe, 4)


# ─── (C) MDD ───


def _calc_mdd(prices: np.ndarray) -> tuple[float | None, float | None]:
    """Maximum Drawdown을 계산한다.

    Returns:
        (mdd_ratio, mdd_percent)  예: (0.15, 15.0)
    """
    if len(prices) < 2:
        return None, None

    peak = np.maximum.accumulate(prices)
    drawdown = (prices - peak) / peak
    mdd_ratio = float(np.min(drawdown))
    mdd_percent = round(mdd_ratio * 100, 2)
    mdd_ratio = round(mdd_ratio, 4)

    return mdd_ratio, mdd_percent


# ─── (D) 롤링 수익률 ───

ROLLING_WINDOWS = {
    "1M": 21,
    "3M": 63,
    "6M": 126,
    "12M": 252,
}


def _calc_rolling_returns(
    ticker: str,
    prices: np.ndarray,
) -> list[RollingReturn]:
    """1M/3M/6M/12M 롤링 수익률을 계산한다."""
    results: list[RollingReturn] = []

    for label, days in ROLLING_WINDOWS.items():
        if len(prices) >= days + 1:
            ret = (prices[-1] / prices[-days - 1] - 1) * 100
            results.append(
                RollingReturn(
                    ticker=ticker,
                    window=label,
                    value=round(float(ret), 2),
                )
            )
        else:
            results.append(
                RollingReturn(ticker=ticker, window=label, value=None)
            )

    return results


# ─── (E) 상관관계 행렬 ───


def _calc_correlations(
    series_dict: dict[str, np.ndarray],
) -> list[CorrelationPair]:
    """N×N 상관행렬을 계산하여 flat list로 반환한다."""
    tickers = list(series_dict.keys())
    if len(tickers) < 2:
        return []

    # 최소 공통 길이로 맞춤
    min_len = min(len(s) for s in series_dict.values())
    if min_len < MIN_TRADING_DAYS:
        return []

    # 일별 수익률 행렬 구성
    returns_matrix = []
    for t in tickers:
        prices = series_dict[t][-min_len:]
        daily_ret = np.diff(prices) / prices[:-1]
        returns_matrix.append(daily_ret)

    returns_matrix = np.array(returns_matrix)
    corr_matrix = np.corrcoef(returns_matrix)

    pairs: list[CorrelationPair] = []
    for i in range(len(tickers)):
        for j in range(i + 1, len(tickers)):
            val = float(corr_matrix[i, j])
            if not math.isnan(val):
                pairs.append(
                    CorrelationPair(
                        ticker_a=tickers[i],
                        ticker_b=tickers[j],
                        correlation=round(val, 4),
                    )
                )

    return pairs


# ─── (F) 메인 분석 진입점 ───


def analyze_performance(
    tickers: list[str],
    period: str = "1y",
    risk_free_rate: float = 0.035,
) -> PerformanceAnalysisResponse:
    """성과 분석 메인 함수.

    병렬 가격 수집 → 개별 지표 계산 → 상관관계 → 응답 조립.
    """
    now = datetime.now(timezone.utc)

    # 병렬 가격 수집
    price_data: dict[str, tuple[np.ndarray, str]] = {}

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        future_map = {
            executor.submit(_fetch_price_series, t, period): t
            for t in tickers
        }
        for future in as_completed(future_map):
            ticker = future_map[future]
            try:
                t, prices, name = future.result()
                if prices is not None and len(prices) > 0:
                    price_data[t] = (prices, name)
            except Exception as e:
                logger.error("Performance price fetch failed for %s: %s", ticker, e)

    # 개별 지표 계산
    all_metrics: list[PerformanceMetrics] = []
    all_rolling: list[RollingReturn] = []
    series_for_corr: dict[str, np.ndarray] = {}

    for ticker in tickers:
        if ticker not in price_data:
            all_metrics.append(PerformanceMetrics(ticker=ticker))
            continue

        prices, name = price_data[ticker]
        daily_returns = np.diff(prices) / prices[:-1]

        # Sharpe
        sharpe = _calc_sharpe(daily_returns, risk_free_rate)

        # MDD
        _, mdd_pct = _calc_mdd(prices)

        # 연율화 수익률
        total_return_pct = None
        annualized_return = None
        if len(prices) >= 2:
            total_ret = (prices[-1] / prices[0] - 1)
            total_return_pct = round(total_ret * 100, 2)
            years = len(prices) / 252
            if years > 0 and total_ret > -1:
                annualized_return = round(
                    ((1 + total_ret) ** (1 / years) - 1) * 100, 2
                )

        # 변동성 (연율화)
        volatility = None
        if len(daily_returns) >= MIN_TRADING_DAYS:
            volatility = round(
                float(np.std(daily_returns, ddof=1)) * math.sqrt(252) * 100, 2
            )

        all_metrics.append(
            PerformanceMetrics(
                ticker=ticker,
                name=name,
                sharpe_ratio=sharpe,
                mdd=mdd_pct,
                annualized_return=annualized_return,
                volatility=volatility,
                total_return=total_return_pct,
                data_points=len(prices),
            )
        )

        # 롤링 수익률
        all_rolling.extend(_calc_rolling_returns(ticker, prices))

        # 상관관계용
        series_for_corr[ticker] = prices

    # 상관관계
    correlations = _calc_correlations(series_for_corr)

    return PerformanceAnalysisResponse(
        metrics=all_metrics,
        rolling_returns=all_rolling,
        correlations=correlations,
        period=period,
        analyzed_at=now,
    )
