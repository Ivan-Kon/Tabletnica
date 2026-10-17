from datetime import datetime

from sqlalchemy import String, Integer, Enum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from backend.src.database import Base


class Prescription(Base):
    __tablename__ = 'prescriptions'

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey('patients.id'))
    entered_by: Mapped[int] = mapped_column(ForeignKey('users.id'))
    source_type: Mapped[str] = mapped_column(Enum('papper', 'import', 'manual'))
    source_document_number: Mapped[int] = mapped_column(Integer)
    prescribed_by: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(Enum('new', 'pending_setup', 'configured', 'active', 'paused', 'completed'))
    created_at: Mapped[datetime] = mapped_column(DateTime)
    updated_at: Mapped[datetime] = mapped_column(DateTime)