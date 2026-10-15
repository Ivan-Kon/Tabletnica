from datetime import date, datetime

from sqlalchemy import String, Integer, Enum, DateTime, DECIMAL, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class PrescriptionItem(Base):
    __tablename__ = 'prescriptions_items'

    id: Mapped[int] = mapped_column(primary_key=True)
    pillbox_id: Mapped[int] = mapped_column(ForeignKey('pillboxes.id'))
    cell_number: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(Enum('free', 'configured', 'active', 'waiting', 'opened', 'missed', 'completed', 'error'))
    created_at: Mapped[datetime] = mapped_column(DateTime)
