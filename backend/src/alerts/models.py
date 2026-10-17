from datetime import datetime

from sqlalchemy import Integer, Enum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from backend.src.database import Base


class Alert(Base):
    __tablename__ = 'alerts'

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey('patients.id'), nullable=True)
    pillbox_id: Mapped[int] = mapped_column(ForeignKey('pillboxes.id'), nullable=True)
    event_id: Mapped[int] = mapped_column(ForeignKey('events.id'), nullable=True)
    alert_type: Mapped[str] = mapped_column(Enum('content_not_removed', 'device_offline', 'device_error', 'course_completed'))
    priority: Mapped[str] = mapped_column(Enum('low', 'medium', 'high', 'critical'))
    status: Mapped[str] = mapped_column(Enum('new', 'viewed', 'resolved'))
    config_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime)
    acknowledged_at: Mapped[datetime] = mapped_column(DateTime)
    acknowledged_by: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=True)