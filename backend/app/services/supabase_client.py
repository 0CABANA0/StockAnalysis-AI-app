from datetime import datetime

from supabase import Client

from app.models.macro import MacroSnapshotResponse, SnapshotData
from app.utils.logger import get_logger

logger = get_logger(__name__)

TABLE = "macro_snapshots"


def insert_snapshot(
    client: Client,
    snapshot: SnapshotData,
    collected_at: datetime,
) -> MacroSnapshotResponse:
    """거시 스냅샷을 DB에 저장하고 결과를 반환한다."""
    data = snapshot.model_dump()
    exchange = data.get("exchange_rates", {})
    commodities = data.get("commodities", {})
    rates = data.get("rates_and_fear", {})

    row = {
        "snapshot_data": data,
        "usd_krw": exchange.get("usd_krw"),
        "vix": rates.get("vix"),
        "us_10y_yield": rates.get("us_10y_yield"),
        "wti": commodities.get("wti"),
        "gold": commodities.get("gold"),
        "collected_at": collected_at.isoformat(),
    }

    result = client.table(TABLE).insert(row).execute()
    inserted = result.data[0]
    logger.info("Snapshot inserted: %s", inserted["id"])
    return _to_response(inserted)


def get_latest(client: Client) -> MacroSnapshotResponse | None:
    """최신 스냅샷 1건을 반환한다."""
    result = (
        client.table(TABLE)
        .select("*")
        .order("collected_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        return None
    return _to_response(result.data[0])


def get_history(
    client: Client,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[MacroSnapshotResponse], int]:
    """스냅샷 이력을 페이지네이션으로 반환한다."""
    # 전체 개수 조회
    count_result = (
        client.table(TABLE)
        .select("id", count="exact")
        .execute()
    )
    total = count_result.count or 0

    # 데이터 조회
    result = (
        client.table(TABLE)
        .select("*")
        .order("collected_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    snapshots = [_to_response(row) for row in result.data]
    return snapshots, total


def _to_response(row: dict) -> MacroSnapshotResponse:
    """DB row를 응답 모델로 변환한다."""
    snapshot_data = row.get("snapshot_data", {})
    if isinstance(snapshot_data, dict):
        snapshot = SnapshotData(**snapshot_data)
    else:
        snapshot = SnapshotData()

    return MacroSnapshotResponse(
        id=row["id"],
        snapshot_data=snapshot,
        usd_krw=row.get("usd_krw"),
        vix=row.get("vix"),
        us_10y_yield=row.get("us_10y_yield"),
        wti=row.get("wti"),
        gold=row.get("gold"),
        collected_at=row["collected_at"],
        created_at=row["created_at"],
    )
