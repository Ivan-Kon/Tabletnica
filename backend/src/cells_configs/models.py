from datetime import datetime

from sqlalchemy import Enum, DateTime, DECIMAL, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from backend.src.database import Base


class CellConfig(Base):
    __tablename__ = 'cells_configs'

    id: Mapped[int] = mapped_column(primary_key=True)
    cell_id: Mapped[int] = mapped_column(ForeignKey('cells.id'))
    assignment_id: Mapped[int] = mapped_column(ForeignKey('pillboxes_assignments.id'), nullable=True)
    prescription_item_id: Mapped[int] = mapped_column(ForeignKey('prescriptions_items.id'))
    baseline_weight: Mapped[float] = mapped_column(DECIMAL)
    status: Mapped[str] = mapped_column(Enum('active', 'configured', 'completed'))
    configured_at: Mapped[datetime] = mapped_column(DateTime)
    loaded_at: Mapped[datetime] = mapped_column(DateTime)