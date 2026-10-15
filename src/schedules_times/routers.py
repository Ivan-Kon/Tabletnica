from typing import List
from fastapi import APIRouter

from src.schedules_times.crud import get_schedule_time, get_schedules_times, add_schedule_time
from src.schedules_times.schemas import ScheduleTimeSchema, ScheduleTimeOutSchema
from src.session import SessionDep

router = APIRouter(
    prefix="/schedules_times",
    tags=["schedules_times"],
)

@router.get("/get_schedules_times", summary="Получение всех времен для рецептов",status_code=200,response_model=List[ScheduleTimeSchema])
async def get_schedules_from_db(session: SessionDep) -> List[ScheduleTimeSchema]:
    """Получение всех времен для рецептов"""
    schedules = await get_schedules_times(session)
    return schedules


@router.get("/get_schedule_time/{schedule_time_id}", summary="Получение всех времен для рецептов",status_code=200,response_model=List[ScheduleTimeSchema])
async def get_schedules_from_db(session: SessionDep, schedule_time_id: int) -> ScheduleTimeSchema:
    """Получение времени для рецептов"""
    schedule = await get_schedule_time(session,schedule_time_id)
    return schedule