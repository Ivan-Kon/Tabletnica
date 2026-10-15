from datetime import date, datetime

from sqlalchemy import String, Integer, Enum, DateTime, DECIMAL, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class DeviceConfig(Base):
    __tablename__ = 'devices_configs'

    id: Mapped[int] = mapped_column(primary_key=True)
    pillbox_id: Mapped[int] = mapped_column(ForeignKey('pillboxes.id'))
    config_version: Mapped[int] = mapped_column(Integer)
    payload: Mapped[dict] = mapped_column(JSON)
    status: Mapped[str] = mapped_column(Enum('created', 'sent', 'acknowledged', 'error'))
    sent_at: Mapped[datetime] = mapped_column(DateTime)
    acknowledged_at: Mapped[datetime] = mapped_column(DateTime)