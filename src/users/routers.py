from fastapi import APIRouter, HTTPException
from starlette import status

from src.users.models import User
from src.users.schemas import LoginUserSchema, UserSchema
from src.users.crud import login_user, register_user
from src.session import SessionDep

router = APIRouter(
    prefix="/users",
    tags=["users"],
)

@router.post("/check_user")
async def checks_user(user: LoginUserSchema):
    return user


@router.post("/login")
async def login(data: LoginUserSchema, session: SessionDep):
    """Вход пользователя"""
    user = await login_user(session, data.username, data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Incorrect username or password")
    return user


@router.post("/register")
async def login(data: UserSchema, session: SessionDep):
    """Регистрация пользователя"""
    await register_user(session, data.username, data.password, data.job_title, data.name)
    return {"message": "Врач успешно зарегистрирован"}



