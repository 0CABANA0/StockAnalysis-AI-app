from datetime import datetime, timezone

from fastapi import APIRouter

from app.models.macro import HealthResponse

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(timestamp=datetime.now(timezone.utc))
