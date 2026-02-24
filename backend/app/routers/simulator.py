from fastapi import APIRouter, Depends
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user
from app.models.simulator import SimulationRequest, SimulationResult
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
