from datetime import date

from sqlalchemy import String, Integer, Enum, DateTime, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base

class Schedule(Base):
    __tablename__ = 'Schedules'

    id: Mapped[int] = mapped_column(primary_key=True)
    schedule_type: Mapped[str] = mapped_column(Enum('specific_times', 'interval'))
    interval_minutes: Mapped[int] = mapped_column(Integer)
    anchor_at: Mapped[DateTime] = mapped_column(DateTime)
    start_date: Mapped[DateTime] = mapped_column(Date)
    end_date: Mapped[DateTime] = mapped_column(Date)
    status: Mapped[str] = mapped_column(Enum('active', 'paused', 'completed'))


class ScheduleTime(Base):
    __tablename__ = 'ScheduleTimes'

    id: Mapped[int] = mapped_column(primary_key=True)
    schedule_id: Mapped[int] = mapped_column(ForeignKey('Schedules.id'))
    time_of_day: Mapped[DateTime] = mapped_column(DateTime)