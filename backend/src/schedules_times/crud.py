from datetime import time
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.schedules_times.models import ScheduleTime


async def get_schedules_times(session: AsyncSession) -> List[ScheduleTime]:
    """Получение всех времен для рецептов"""
    schedules_times = await session.execute(select(ScheduleTime))
    return schedules_times.scalars().all()


async def get_schedule_time(session: AsyncSession, schedule_time_id: ScheduleTime.id) -> ScheduleTime:
    """Получение времени для рецепта"""
    schedule_time = await session.get(ScheduleTime, schedule_time_id)
    return schedule_time


async def add_schedule_time(session: AsyncSession, schedule_id: int, time_of_day: time) -> ScheduleTime:
    """Добавление нового времени для рецепта"""
    new_schedule_time = ScheduleTime(
        schedule_id=schedule_id,
        time_of_day=time_of_day
    )
    session.add(new_schedule_time)
    await session.commit()
    await session.refresh(new_schedule_time)
    return new_schedule_time