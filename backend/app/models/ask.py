from pydantic import BaseModel
from typing import Any


class AskRequest(BaseModel):
    question: str


class DeepLinkItem(BaseModel):
    label: str
    url: str


class AskResponse(BaseModel):
    answer: str
    deeplinks: list[DeepLinkItem] = []
    context_data: dict[str, Any] = {}
