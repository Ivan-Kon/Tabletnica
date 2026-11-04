from datetime import datetime, date
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field, model_validator

class ScheduleType(str, Enum):
    specific_times = "specific_times"
    interval = "interval"

class ScheduleStatus(str, Enum):
    active = "active"
    paused = "paused"
    completed = "completed"

class ScheduleTypeSchema(BaseModel):
    status: ScheduleStatus

class ScheduleShema(ScheduleTypeSchema):
    model_config = ConfigDict(from_attributes=True)
    schedule_type: ScheduleType
    interval_minutes: int | None = Field(default=None, gt=0)
    cell_config_id: int = Field(gt=0)
    anchor_at: datetime | None = None
    start_date: date
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_schedule(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("End date must not precede start date")
        if self.schedule_type == ScheduleType.interval and (self.interval_minutes is None or self.anchor_at is None):
            raise ValueError("Interval schedules require interval_minutes and anchor_at")
        return self

class ScheduleOutShema(ScheduleShema):
    id: int
