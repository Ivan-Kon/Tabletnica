from datetime import datetime
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
    role: JobTitle
    full_name: str
    active: bool


class UserOutSchema(UserSchema):
    id: int
    created_at: datetime
    updated_at: datetime
