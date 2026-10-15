from datetime import datetime, date

from src.schemas import BaseModel


class ScheduleTimeSchema(BaseModel):
    schedule_id: int
    time_of_day: datetime


class ScheduleTimeOutSchema(ScheduleTimeSchema):
    schedule_time_id: int
