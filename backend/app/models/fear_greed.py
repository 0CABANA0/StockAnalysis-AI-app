from pydantic import BaseModel
from typing import Any


class FearGreedSnapshot(BaseModel):
    index_value: int
    label: str  # EXTREME_FEAR, FEAR, NEUTRAL, GREED, EXTREME_GREED
    components: dict[str, Any] = {}
    snapshot_at: str


class FearGreedResponse(BaseModel):
    current: FearGreedSnapshot | None = None
    history: list[FearGreedSnapshot] = []
