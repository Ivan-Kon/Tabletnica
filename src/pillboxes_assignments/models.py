from datetime import date, datetime

from sqlalchemy import String, Integer, Enum, DateTime, DECIMAL, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class PillboxAssignment(Base):
    __tablename__ = 'pillboxes_assignments'

    id: Mapped[int] = mapped_column(primary_key=True)
    pillbox_id: Mapped[int] = mapped_column(ForeignKey('pillboxes.id'))
    patient_id: Mapped[int] = mapped_column(ForeignKey('patients.id'))
    assigned_by: Mapped[int] = mapped_column(ForeignKey('users.id'))
    baseline_weight: Mapped[float] = mapped_column(DECIMAL)
    status: Mapped[str] = mapped_column(Enum('active', 'completed'))
    assigned_at: Mapped[datetime] = mapped_column(DateTime)
    unassigned_at: Mapped[datetime] = mapped_column(DateTime)