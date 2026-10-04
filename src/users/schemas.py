from enum import Enum

from src.schemas import *


class JobTitle(str, Enum):
    admin = "admin"
    nurse = "nurse"
    doctor = "doctor"


class LoginUserSchema(BaseModel):
    username: str
    password: str


class UserSchema(LoginUserSchema):
    name: str
    job_title: JobTitle
