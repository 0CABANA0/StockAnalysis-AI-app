from pydantic import BaseModel


class WatchlistItem(BaseModel):
    id: str
    ticker: str
    company_name: str
    market: str
    asset_type: str = "STOCK"
    added_at: str


class WatchlistAddRequest(BaseModel):
    ticker: str
    company_name: str
    market: str
    asset_type: str = "STOCK"


class WatchlistResponse(BaseModel):
    items: list[WatchlistItem]
    total: int
