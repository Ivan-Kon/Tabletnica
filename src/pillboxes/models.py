from datetime import date, datetime

from sqlalchemy import String, Integer, Enum, DateTime, DECIMAL, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class Pillbox(Base):
    __tablename__ = 'pillboxes'

    id: Mapped[int] = mapped_column(primary_key=True)
    serial_number: Mapped[str] = mapped_column(String(50))
    serial_number: Mapped[str] = mapped_column(String(50))
    device_token_hash: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(Enum('avalible', 'offline', 'assigned', 'maintenance', 'active', 'error'))
    last_seen_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime)
    updated_at: Mapped[datetime] = mapped_column(DateTime)