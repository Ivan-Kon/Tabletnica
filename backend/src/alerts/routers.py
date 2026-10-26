from fastapi import APIRouter

from backend.src.alerts.crud import get_alerts
from backend.src.alerts.schemas import AlertOutSchema
from backend.src.dependencies import SessionDep

router = APIRouter(
    prefix="/alerts",
    tags=["alerts"],
)

@router.get("/get_all")
async def get_all(session: SessionDep) -> list[AlertOutSchema]:
    alerts = await get_alerts(session)
    return alerts