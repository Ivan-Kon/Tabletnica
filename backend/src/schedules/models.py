from sqlalchemy import Integer, Enum, DateTime, Date, BigInteger, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from backend.src.database import Base

class Schedule(Base):
    __tablename__ = 'schedules'

    id: Mapped[int] = mapped_column(BigInteger,primary_key=True)
    cell_config_id: Mapped[int] = mapped_column(BigInteger,ForeignKey('cells_configs.id'))
    schedule_type: Mapped[str] = mapped_column(Enum('specific_times', 'interval'))
    interval_minutes: Mapped[int] = mapped_column(Integer)
    anchor_at: Mapped[DateTime] = mapped_column(DateTime)
    start_date: Mapped[Date] = mapped_column(Date)
    end_date: Mapped[Date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(Enum('active', 'paused', 'completed'))
