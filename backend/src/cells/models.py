from datetime import datetime

from sqlalchemy import Integer, Enum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from backend.src.database import Base


class Cells(Base):
    __tablename__ = 'cells'

    id: Mapped[int] = mapped_column(primary_key=True)
    pillbox_id: Mapped[int] = mapped_column(ForeignKey('pillboxes.id'))
    cell_number: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(Enum('free', 'configured', 'active', 'waiting', 'opened', 'missed', 'completed', 'error'))
    created_at: Mapped[datetime] = mapped_column(DateTime)
