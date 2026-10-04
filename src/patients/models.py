from sqlalchemy import String, Integer, Enum, DateTime, Column
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base
from src.patients.schemas import PatientStatus


class Patient(Base):
    __tablename__ = "Patients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String)
    room_number: Mapped[str] = mapped_column(String)
    bed_number: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(Enum(PatientStatus))
    created_at: Mapped[DateTime] = mapped_column(DateTime)
    updated_at: Mapped[DateTime] = mapped_column(DateTime)