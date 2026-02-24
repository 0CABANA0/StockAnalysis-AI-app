from pydantic import BaseModel
from typing import Any


class SimulationRequest(BaseModel):
    scenario_type: str  # RATE_HIKE, FX_SHOCK, GEO_CONFLICT, TARIFF_WAR
    params: dict[str, Any] = {}


class SimulationResult(BaseModel):
    scenario_type: str
    params: dict[str, Any]
    result: dict[str, Any]
