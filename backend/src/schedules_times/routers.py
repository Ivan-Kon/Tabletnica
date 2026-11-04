from fastapi import APIRouter, HTTPException
from backend.src.schedules_times.crud import get_schedule_time, get_schedules_times
from backend.src.schedules_times.schemas import ScheduleTimeOutSchema
from backend.src.dependencies import SessionDep

router = APIRouter(prefix="/schedules_times", tags=["schedules_times"])

@router.get("/get_schedules_times", response_model=list[ScheduleTimeOutSchema])
async def get_all(session: SessionDep):
    return await get_schedules_times(session)

@router.get("/get_schedule_time/{schedule_time_id}", response_model=ScheduleTimeOutSchema)
async def get_one(session: SessionDep, schedule_time_id: int):
    value = await get_schedule_time(session, schedule_time_id)
    if value is None:
        raise HTTPException(404, "Schedule time not found")
    return value
