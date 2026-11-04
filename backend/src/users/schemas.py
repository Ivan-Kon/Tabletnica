from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field

class JobTitle(str, Enum):
    admin = "admin"
    nurse = "nurse"
    elder_nurse = "elder_nurse"

class LoginUserSchema(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=256)

class UserSchema(LoginUserSchema):
    role: JobTitle
    full_name: str = Field(min_length=1, max_length=100)
    active: bool = True

class UserOutSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    full_name: str
    role: JobTitle
    active: bool
    created_at: datetime
    updated_at: datetime
