from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict

class PillboxesOutSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    serial_number: str
    status: Literal["available", "avalible", "offline", "assigned", "maintenance", "active", "error"]
    last_seen_at: datetime | None
    created_at: datetime
    updated_at: datetime
