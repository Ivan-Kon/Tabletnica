from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict

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
    resolved = "resolved"

class AlertOutSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    patient_id: int | None
    pillbox_id: int | None
    event_id: int | None
    alert_type: AlertType
    priority: AlertPriority
    status: AlertStatus
    config_version: int
    acknowledged_by: int | None
    created_at: datetime
    acknowledged_at: datetime | None
