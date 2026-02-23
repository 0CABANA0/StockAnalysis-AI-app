"""이미지 분석 API — Vision OCR + 종목 검증 + AI 투자 가이드 (모듈 G)."""

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user
from app.models.image import ImageAnalysisRequest, ImageAnalysisResponse
from app.services import image_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/image", tags=["image"])

ALLOWED_MEDIA_TYPES = {"image/jpeg", "image/png", "image/webp"}
# 10MB 이미지의 base64 인코딩 ≈ 13.3MB → 14MB 상한
MAX_BASE64_LENGTH = 14 * 1024 * 1024


@router.post("/analyze", response_model=ImageAnalysisResponse)
def analyze(
    body: ImageAnalysisRequest,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """증권사 스크린샷을 OCR 분석하고 AI 투자 가이드를 생성한다."""
    # media_type 검증
    if body.media_type not in ALLOWED_MEDIA_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"지원하지 않는 이미지 형식입니다: {body.media_type}. "
                f"허용: {', '.join(sorted(ALLOWED_MEDIA_TYPES))}"
            ),
        )

    # base64 크기 검증
    if len(body.image_data) > MAX_BASE64_LENGTH:
        raise HTTPException(
            status_code=400,
            detail="이미지 크기가 10MB를 초과합니다.",
        )

    logger.info(
        "Image analysis requested by %s (type: %s, size: %d chars)",
        user.user_id,
        body.media_type,
        len(body.image_data),
    )

    try:
        result = image_service.analyze_image(
            image_data=body.image_data,
            media_type=body.media_type,
            client=client,
            user_id=user.user_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Image analysis failed: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"이미지 분석 중 오류가 발생했습니다: {e}",
        )

    return result
