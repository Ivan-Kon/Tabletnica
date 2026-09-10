from datetime import date

from pydantic import BaseModel

class PatientSchema(BaseModel):
    name: str
    birth_date: date
    id_doctor: int
    num_room: int

class PersonalSchema(BaseModel):
    username: str
    password: str
    name: str
    job_title: str
