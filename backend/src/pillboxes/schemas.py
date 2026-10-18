from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class PillboxStatus(str,Enum):
    available = "available"
    offline = "offline"
    maintenance = "maintenance"
    active = "active"
    error = "error"
    assigned = "assigned"


class PillboxesStatusSchema(BaseModel):
    status: PillboxStatus


class PillboxesSchema(PillboxesStatusSchema):
    serial_number: str
    device_token_hash: str
    status: PillboxesStatusSchema
    last_seen_at: datetime


class PillboxesOutSchema(PillboxesSchema):
    id: int
    created_at: datetime
    updated_at: datetime

