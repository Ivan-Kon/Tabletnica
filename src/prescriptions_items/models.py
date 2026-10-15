from datetime import date, datetime

from sqlalchemy import String, Integer, Enum, DateTime, DECIMAL, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class PrescriptionItem(Base):
    __tablename__ = 'prescriptions_items'

    id: Mapped[int] = mapped_column(primary_key=True)
    prescription_id: Mapped[int] = mapped_column(ForeignKey('prescriptions.id'))
    drug_name: Mapped[str] = mapped_column(String(255))
    dosage: Mapped[str] = mapped_column(String(255))
    quantity: Mapped[float] = mapped_column(DECIMAL)
    dosage_form: Mapped[str] = mapped_column(45)
    start_date: Mapped[datetime] = mapped_column(date)
    end_date: Mapped[datetime] = mapped_column(date)
    status: Mapped[str] = mapped_column(Enum('new', 'pending_setup', 'configured', 'active', 'paused', 'completed'))
    external_drug_id: Mapped[str] = mapped_column(String(45))
    drug_source: Mapped[str] = mapped_column(String(45))
    created_at: Mapped[datetime] = mapped_column(DateTime)
    updated_at: Mapped[datetime] = mapped_column(DateTime)