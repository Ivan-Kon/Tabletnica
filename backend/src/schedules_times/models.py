from sqlalchemy import ForeignKey, Time
from sqlalchemy.orm import Mapped, mapped_column

from backend.src.database import Base

class ScheduleTime(Base):
    __tablename__ = 'schedule_times'

    id: Mapped[int] = mapped_column(primary_key=True)
    schedule_id: Mapped[int] = mapped_column(ForeignKey('schedules.id'))
    time_of_day: Mapped[Time] = mapped_column(Time)