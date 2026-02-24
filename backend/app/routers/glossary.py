from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from app.dependencies import get_supabase
from app.middleware.auth import CurrentUser, get_current_user
from app.models.glossary import GlossaryListResponse, GlossaryTermResponse
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api/glossary", tags=["glossary"])


@router.get("/", response_model=GlossaryListResponse)
def list_terms(
    category: str | None = Query(default=None),
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """용어 목록."""
    query = client.table("glossary_terms").select("*").order("term")
    if category:
        query = query.eq("category", category)
    result = query.execute()
    terms = [GlossaryTermResponse(**t) for t in (result.data or [])]
    return GlossaryListResponse(terms=terms, total=len(terms))


@router.get("/{term}", response_model=GlossaryTermResponse)
def get_term(
    term: str,
    _user: CurrentUser = Depends(get_current_user),
    client: Client = Depends(get_supabase),
):
    """개별 용어."""
    result = client.table("glossary_terms").select("*").eq("term", term).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Term not found")
    return GlossaryTermResponse(**result.data)
