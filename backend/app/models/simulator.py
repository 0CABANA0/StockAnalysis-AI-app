from pydantic import BaseModel, Field
from typing import Any


class SimulationRequest(BaseModel):
    scenario_type: str  # RATE_HIKE, FX_SHOCK, GEO_CONFLICT, TARIFF_WAR
    params: dict[str, Any] = {}


class PortfolioSimulationRequest(BaseModel):
    """이미지 기반 포트폴리오 시나리오 분석 요청.

    image_data가 있으면 OCR로 종목 추출 후 시뮬레이션.
    holdings가 있으면 OCR 없이 바로 시뮬레이션 (시나리오 변경 시 활용).
    """

    scenario_type: str
    params: dict[str, Any] = {}
    # 경로 A: 이미지 업로드 (첫 요청)
    image_data: str | None = Field(
        default=None, description="Base64 인코딩된 포트폴리오 이미지"
    )
    media_type: str = Field(
        default="image/png", description="이미지 MIME 타입"
    )
    # 경로 B: 이미 추출된 보유 종목 (시나리오 변경 시)
    holdings: list[dict[str, Any]] | None = Field(
        default=None, description="이미 추출된 보유 종목 리스트"
    )


class SimulationResult(BaseModel):
    scenario_type: str
    params: dict[str, Any]
    result: dict[str, Any]


class PortfolioSimulationResult(BaseModel):
    """포트폴리오 시뮬레이션 응답 — 추출된 holdings도 함께 반환."""

    scenario_type: str
    params: dict[str, Any]
    result: dict[str, Any]
    holdings: list[dict[str, Any]] | None = None
