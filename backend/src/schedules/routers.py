from typing import List
from fastapi import APIRouter, HTTPException

from backend.src.schedules.crud import get_schedules, get_schedule, add_schedule, update_schedule #add_schedule_time
from backend.src.schedules.schemas import ScheduleShema, ScheduleOutShema
from backend.src.session import SessionDep


router = APIRouter(
    prefix="/schedules",
    tags=["schedules"],
)


@router.get("/get_all", summary="Получить все расписания",status_code=200,response_model=List[ScheduleOutShema])
async def get_schedules_from_db(session: SessionDep) -> List[ScheduleOutShema]:
    """Получение всех рецептов"""
    schedules = await get_schedules(session)
    return schedules


@router.get("/get/{schedule_id}", summary="Получить одно расписание", status_code=200,response_model=ScheduleOutShema)
async def get_schedule_from_db(schedule_id: int, session: SessionDep) -> ScheduleOutShema:
    schedule = await get_schedule(session, schedule_id)
    if schedule:
        return schedule
    raise HTTPException(status_code=404, detail="Patient not found")


@router.post("/add", summary="Создать новое расписание",status_code=201,response_model=ScheduleShema)
async def add_schedule_from_db(session: SessionDep, schedule: ScheduleShema) -> ScheduleOutShema:
    """Создать новое расписание"""
    schedule = await add_schedule(
        session=session,
        schedule_type=schedule.schedule_type,
        interval_minutes=schedule.interval_minutes,
        anchor_at=schedule.anchor_at,
        start_date=schedule.start_date,
        end_date=schedule.end_date,
        status=schedule.status
    )
    return schedule


@router.patch("/update_status", summary="Обновить статус расписания", status_code=200,response_model=ScheduleOutShema)
async def update_schedule_status_from_db(session: SessionDep, schedule_int: int, status_schedule: str) -> ScheduleOutShema:
    schedule = await update_schedule(session, schedule_int, status_schedule)
    if not schedule:
        raise HTTPException(status_code=404, detail="Patient not found")
    return schedule


# @router.post("/add_schedule_time", summary="Получение всех времен для рецептов",status_code=201,response_model=ScheduleShema)
# async def add_schedule_time_from_db(session: SessionDep, schedule_time: ScheduleTimeSchema) -> ScheduleTimeSchema:
#     """Создание нового времени для рецепта"""
#     schedule = await add_schedule_time(
#         session=session,
#         schedule_id=schedule_time.schedule_id,
#         time_of_day=schedule_time.time_of_day
#     )
#     return schedule

