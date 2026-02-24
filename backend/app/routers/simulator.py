from fastapi import APIRouter, Depends
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user
from app.models.simulator import SimulationRequest, SimulationResult
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
    # TODO: 실제 AI 분석 로직
    result = {
        "summary": "시나리오 분석 기능은 백엔드 구현 후 활성화됩니다.",
        "impact": {},
    }

    # 결과 저장
    client.table("scenario_simulations").insert({
        "user_id": user.user_id,
        "scenario_type": req.scenario_type,
        "scenario_params": req.params,
        "result": result,
    }).execute()

    return SimulationResult(
        scenario_type=req.scenario_type,
        params=req.params,
        result=result,
    )
