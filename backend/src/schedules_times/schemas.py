from datetime import time
from pydantic import BaseModel, ConfigDict

class ScheduleTimeSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    schedule_id: int
    time_of_day: time

class ScheduleTimeOutSchema(ScheduleTimeSchema):
    id: int
