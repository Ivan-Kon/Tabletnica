from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class PatientStatus(str, Enum):
    active = "active"
    discharged = "discharged"
    archive = "archive"


class StatusPatientSchema(BaseModel):
    status: PatientStatus


class PatientSchema(StatusPatientSchema):
    model_config = ConfigDict(str_strip_whitespace=True, from_attributes=True)
    full_name: str = Field(min_length=1, max_length=100)
    room_number: str = Field(min_length=1, max_length=20)
    bed_number: str = Field(min_length=1, max_length=20)


class PatientOutSchema(PatientSchema):
    id: int
    created_at: datetime
    updated_at: datetime

