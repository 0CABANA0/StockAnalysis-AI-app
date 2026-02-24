from fastapi import APIRouter, Depends
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user
from app.models.ask import AskRequest, AskResponse, DeepLinkItem
from app.services import ask_service
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/ask", tags=["ask"])


@router.post("/", response_model=AskResponse)
def ask_question(
    req: AskRequest,
    user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """AI Q&A."""
    result = ask_service.ask_question(
        client=client,
        user_id=user.user_id,
        question=req.question,
    )

    return AskResponse(
        answer=result["answer"],
        deeplinks=[DeepLinkItem(**d) for d in result.get("deeplinks", [])],
        context_data=result.get("context_data", {}),
    )
