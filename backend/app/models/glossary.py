from pydantic import BaseModel


class GlossaryTermResponse(BaseModel):
    term: str
    category: str
    definition_short: str
    definition_long: str | None = None
    related_terms: list[str] = []
    examples: str | None = None


class GlossaryListResponse(BaseModel):
    terms: list[GlossaryTermResponse]
    total: int
