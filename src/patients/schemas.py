from datetime import datetime
from enum import Enum

from src.schemas import BaseModel


class PatientStatus(str, Enum):
    active = "active"
    discharged = "discharged"
    archive = "archive"


class StatusPatientSchema(BaseModel):
    status: PatientStatus



class PatientSchema(StatusPatientSchema):
    full_name: str
    room_number: str
    bed_number: str
    created_at: datetime
    updated_at: datetime


class PatientOutSchema(PatientSchema):
    id: int