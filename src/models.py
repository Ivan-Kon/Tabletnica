from datetime import date

from sqlalchemy import String, Integer, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class Patient(Base):
    __tablename__ = 'patients'

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(128))
    room_num: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(Enum('active', 'discharged', 'archive'))
    created_at: Mapped[date] = mapped_column(DateTime)
    updated_at: Mapped[date] = mapped_column(DateTime)


class Doctor(Base):
    __tablename__ = 'doctors'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    username: Mapped[str] = mapped_column(String(128))
    password: Mapped[str] = mapped_column(String(128))