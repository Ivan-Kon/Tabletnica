from datetime import datetime

from sqlalchemy import String, Enum, DateTime, BOOLEAN
from sqlalchemy.dialects.mysql import JSON
from sqlalchemy.ext.mutable import MutableList
from sqlalchemy.orm import Mapped, mapped_column

from backend.src.database import Base


class User(Base):
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50))
    password_hash: Mapped[str] = mapped_column(String(255))
    sessions_id: Mapped[list[str]] = mapped_column(String(50), nullable=True)
    full_name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(Enum('admin', 'elder_nurse', 'nurse'))
    active: Mapped[bool] = mapped_column(BOOLEAN)
    created_at: Mapped[datetime] = mapped_column(DateTime)
    updated_at: Mapped[datetime] = mapped_column(DateTime)


