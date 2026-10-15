from datetime import date, datetime

from sqlalchemy import String, Integer, Enum, DateTime, DECIMAL, ForeignKey, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class WeightMeasurements(Base):
    __tablename__ = 'weight_measurements'

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey('events.id'))
    cell_config_id: Mapped[int] = mapped_column(ForeignKey('cells_configs.id'))
    weight_before: Mapped[float] = mapped_column(DECIMAL)
    weight_after: Mapped[float] = mapped_column(DECIMAL)
    weight_delta: Mapped[float] = mapped_column(DECIMAL)
    content_removed: Mapped[bool] = mapped_column(Boolean)
    measured_at: Mapped[datetime] = mapped_column(DateTime)