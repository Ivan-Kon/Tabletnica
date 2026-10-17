from sqlalchemy import String, Integer, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from backend.src.database import Base
from backend.src.patients.schemas import PatientStatus


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(100))
    room_number: Mapped[str] = mapped_column(String(50))
    bed_number: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(Enum(PatientStatus))
    created_at: Mapped[DateTime] = mapped_column(DateTime)
    updated_at: Mapped[DateTime] = mapped_column(DateTime)