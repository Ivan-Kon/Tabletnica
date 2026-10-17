from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class AlertType(str, Enum):
    content_not_removed = "content_not_removed"
    device_offline = "device_offline"
    device_error = "device_error"
    course_completed = "course_completed"


class AlertPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class AlertStatus(str, Enum):
    new = "new"
    viewed = "viewed"
    solved = "solved"


class AlertTypeSchema(BaseModel):
    status: AlertStatus


class AlertPrioritySchema(BaseModel):
    priority: AlertPriority


class AlertStatusSchema(BaseModel):
    status: AlertStatus


class AlertSchema(AlertStatusSchema,AlertPrioritySchema,AlertTypeSchema):
    patient_id: int
    pillbox_id: int
    event_id: int
    config_version: int
    acknowledged_by: int


class AlertOutSchema(AlertSchema):
    id: int
    created_at: datetime
    acknowledged_at: datetime

