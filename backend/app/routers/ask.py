from fastapi import APIRouter, Depends
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user
from app.models.ask import AskRequest, AskResponse
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
    # TODO: 실제 AI 답변 생성 (OpenRouter)
    answer = "AI Q&A 기능은 백엔드 구현 후 활성화됩니다. 질문: " + req.question
    deeplinks = []

    # 대화 저장
    client.table("ai_conversations").insert({
        "user_id": user.user_id,
        "question": req.question,
        "answer": answer,
        "context_data": {},
        "deeplinks": deeplinks,
    }).execute()

    return AskResponse(answer=answer, deeplinks=deeplinks)
