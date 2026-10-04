from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.schedules.models import Schedule


async def get_schedules(session: AsyncSession) -> List[Schedule]:
    """Получение всех рецептов"""
    schedules = await session.execute(select(Schedule))
    return schedules.scalars().all()

