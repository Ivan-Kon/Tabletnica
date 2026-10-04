from typing import List
from fastapi import APIRouter

from src.schedules.crud import get_schedules
from src.schedules.schemas import ScheduleShema, ScheduleOutShema
from src.session import SessionDep


router = APIRouter(
    prefix="/schedules",
    tags=["schedules"],
)


@router.get("/get_schedules", summary="Получение всех рецептов",status_code=200,response_model=List[ScheduleShema])
async def get_schedules_from_db(session: SessionDep) -> List[ScheduleOutShema]:
    """Получение всех рецептов"""
    schedules = await get_schedules(session)
    return schedules


@router.post("/add_schedule", summary="Получение всех рецептов",status_code=201,response_model=ScheduleShema)
async def add_schedule(session: SessionDep):
    """Отправка данных о расписании на БД schedules"""
    ...
