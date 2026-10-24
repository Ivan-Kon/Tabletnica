from datetime import datetime

from sqlalchemy import Enum, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from backend.src.database import Base


class Event(Base):
    __tablename__ = 'events'

    id: Mapped[int] = mapped_column(primary_key=True)
    pillbox_id: Mapped[int] = mapped_column(ForeignKey('pillboxes.id'))
    patient_id: Mapped[int] = mapped_column(ForeignKey('patients.id'))
    cell_config_id: Mapped[int] = mapped_column(ForeignKey('cells_configs.id'), nullable=True)
    cell_id: Mapped[int] = mapped_column(ForeignKey('cells.id'))
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'))
    event_type: Mapped[str] = mapped_column(Enum('DEVICE_CONNECTED', 'DEVICE_REBOOT', 'SYNC_STARTED', 'SYNC_COMPLETED', 'CONFIG_ACKNOWLEDGED', 'DOSE_TAKEN', 'MISSED_DOSE', 'CELL_OPENED', 'ERROR'))
    last_seen_at: Mapped[datetime] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime)
    updated_at: Mapped[datetime] = mapped_column(DateTime)
