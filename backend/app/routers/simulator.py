from fastapi import APIRouter, Depends
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user
from app.models.simulator import (
    PortfolioSimulationRequest,
    PortfolioSimulationResult,
    SimulationRequest,
    SimulationResult,
)
from app.services import simulator_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/simulator", tags=["simulator"])


@router.post("/analyze", response_model=SimulationResult)
def analyze_scenario(
    req: SimulationRequest,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """What-if 시나리오 분석."""
    result = simulator_service.run_simulation(
        client=client,
        user_id=user.user_id,
        scenario_type=req.scenario_type,
        params=req.params,
    )

    return SimulationResult(
        scenario_type=req.scenario_type,
        params=req.params,
        result=result,
    )


@router.post("/analyze-portfolio", response_model=PortfolioSimulationResult)
def analyze_portfolio_scenario(
    req: PortfolioSimulationRequest,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """포트폴리오 이미지/보유 종목 기반 시나리오 분석."""
    result, holdings = simulator_service.run_portfolio_simulation(
        client=client,
        user_id=user.user_id,
        scenario_type=req.scenario_type,
        params=req.params,
        image_data=req.image_data,
        media_type=req.media_type,
        holdings=req.holdings,
    )

    return PortfolioSimulationResult(
        scenario_type=req.scenario_type,
        params=req.params,
        result=result,
        holdings=holdings,
    )
