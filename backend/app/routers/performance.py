"""성과 분석 API — Sharpe Ratio, MDD, 롤링 수익률, 상관관계."""

from fastapi import APIRouter, Depends, HTTPException

from app.middleware.auth import CurrentUser, get_current_user
from app.models.etf import PerformanceAnalysisRequest, PerformanceAnalysisResponse
from app.services import performance_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/performance", tags=["performance"])


@router.post("/analyze", response_model=PerformanceAnalysisResponse)
def analyze_performance(
    req: PerformanceAnalysisRequest,
    _user: CurrentUser = Depends(get_current_user),
):
    """여러 티커의 성과 분석을 수행한다.

    - Sharpe Ratio, MDD, 연율화 수익률, 변동성
    - 1M/3M/6M/12M 롤링 수익률
    - 티커 쌍별 상관관계
    - DB 접근 불필요 (yfinance 직접 조회)
    """
    if len(req.tickers) > 20:
        raise HTTPException(
            status_code=400, detail="최대 20개 티커까지 분석 가능합니다."
        )

    try:
        return performance_service.analyze_performance(
            tickers=req.tickers,
            period=req.period,
            risk_free_rate=req.risk_free_rate,
        )
    except Exception as e:
        logger.error("Performance analysis failed: %s", e)
        raise HTTPException(status_code=500, detail=f"성과 분석 실패: {e}")
