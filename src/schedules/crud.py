from datetime import datetime, date, time

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.schedules.models import Schedule


async def get_schedules(session: AsyncSession) -> list[Schedule]:
    """Получение всех рецептов"""
    schedules = await session.execute(select(Schedule))
    return schedules.scalars().all()


async def get_schedule(session: AsyncSession, schedule_id: int) -> Schedule:
    schedule = await session.get(Schedule, schedule_id)
    return schedule


async def add_schedule(session: AsyncSession, schedule_type: str, interval_minutes: int, anchor_at: datetime, start_date: date, end_date: date,status: str) -> Schedule:
    """Добавление нового рецепта"""
    new_schedule = Schedule(
        schedule_type=schedule_type,
        interval_minutes=interval_minutes,
        anchor_at=anchor_at,
        start_date=start_date,
        end_date=end_date,
        status=status,
    )
    session.add(new_schedule)
    await session.commit()
    await session.refresh(new_schedule)
    return new_schedule


async def update_schedule(session: AsyncSession, schedule_id: int,schedule_status:str) -> Schedule:
    schedule = await session.get(Schedule, schedule_id)
    if schedule:
        schedule.schedule_status = schedule_status
        await session.commit()
        await session.refresh(schedule)
        return schedule
    return False


# async def add_schedule_time(session: AsyncSession, schedule_id: int, time_of_day: time) -> ScheduleTime:
#     """Добавление нового времени для рецепта"""
#     new_schedule_time = ScheduleTime(
#         schedule_id=schedule_id,
#         time_of_day=time_of_day
#     )
#     session.add(new_schedule_time)
#     await session.commit()
#     await session.refresh(new_schedule_time)
#     return new_schedule_time