from fastapi import APIRouter, HTTPException, Response, Depends
from starlette import status

from backend.src.users.schemas import LoginUserSchema, UserSchema
from backend.src.users.crud import login_user, register_user, add_session_id_to_user
from backend.src.dependencies import SessionDep, get_user_by_session_id
import secrets


router = APIRouter(
    prefix="/users",
    tags=["users"],
)

@router.post("/check_user")
async def checks_user(user: LoginUserSchema):
    return user


@router.post("/login")
async def login(data: LoginUserSchema, session: SessionDep, response: Response):
    """Вход пользователя"""
    user = await login_user(session, data.username, data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Incorrect username or password")

    session_id = secrets.token_urlsafe(32)  # Генерируем токен сессии

    await add_session_id_to_user(session, user.id, session_id)

    # 2. Устанавливаем куку на объекте response
    response.set_cookie(
        key="session_id",  # Имя куки
        value=session_id,  # Значение (токен)
        max_age=86400,  # Время жизни в секундах (24 часа)
        httponly=True,  # 🔒 Запрещает доступ из JavaScript (защита от XSS)
        secure=True,  # 🔒 Только по HTTPS (в продакшене)
        samesite="lax",  # 🔒 Защита от CSRF
        path="/",
    )
    return user


@router.post("/register")
async def login(user: UserSchema, session: SessionDep, response: Response):
    """Регистрация пользователя"""
    user = await register_user(session, user)
    if not user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,detail="Username or password already exists")

    session_id = secrets.token_urlsafe(32)  # Генерируем токен сессии

    await add_session_id_to_user(session, user.id, session_id)

    # 2. Устанавливаем куку на объекте response
    response.set_cookie(
        key="session_id",  # Имя куки
        value=session_id,  # Значение (токен)
        max_age=86400,  # Время жизни в секундах (24 часа)
        httponly=True,  # 🔒 Запрещает доступ из JavaScript (защита от XSS)
        secure=True,  # 🔒 Только по HTTPS (в продакшене)
        samesite="lax",  # 🔒 Защита от CSRF
        path="/",
    )
    return user

