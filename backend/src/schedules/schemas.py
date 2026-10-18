from datetime import datetime, date
from enum import Enum

from backend.src.schemas import BaseModel


class ScheduleType(str, Enum):
    specific_times = 'specific_times'
    interval = 'interval'


class ScheduleStatus(str, Enum):
    active = 'active'
    paused = 'paused'
    completed = 'completed'


class ScheduleTypeSchema(BaseModel):
    status: ScheduleStatus


class ScheduleShema(ScheduleTypeSchema):
    schedule_type: ScheduleType
    interval_minutes: int
    cell_config_id: int
    anchor_at: datetime
    start_date: date
    end_date: date
    status: ScheduleStatus


class ScheduleOutShema(ScheduleShema):
    id: int