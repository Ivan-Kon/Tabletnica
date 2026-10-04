from datetime import datetime, date
from enum import Enum

from src.schemas import BaseModel


class ScheduleType(str, Enum):
    specific_times = 'specific_times'
    interval = 'interval'


class ScheduleStatus(str, Enum):
    active = 'active'
    paused = 'paused'
    completed = 'completed'


class ScheduleTimeSchema(BaseModel):
    time: datetime


class ScheduleShema(ScheduleTimeSchema):
    schedule_type: ScheduleType
    interval_minutes: int
    anchor_at: datetime
    start_date: date
    end_date: date
    staus: ScheduleStatus


class ScheduleOutShema(ScheduleShema):
    id: int