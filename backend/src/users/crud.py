from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.src.hash import hash_password, verify_password, pwd_context
from backend.src.users.models import User


async def login_user(session: AsyncSession, username, password) -> User | None:
    """Проверка пользователя в БД."""

    # 1. Ищем ТОЛЬКО по username — пароль в SQL не суём!
    user = await session.scalar(
        select(User).where(User.username == username)
    )

    # 2. Одинаковый ответ для «нет юзера» и «неверный пароль» — anti-enumeration
    if user is None:
        # опционально: "fake verify" против timing-атак,
        # чтобы время ответа не отличалось
        await verify_password(password, pwd_context.hash("dummy"))
        return None

    # 3. Сверяем пароль через verify (constant-time, соль достаётся из хеша)
    if not await verify_password(password, user.password_hash):
        return None

    return user


async def register_user(session: AsyncSession,user) -> User | None:
    """Регистрация пользователя в БД."""

    existing = await session.scalar(
        select(User).where(User.username == user.username)
    )
    if existing is not None:
        return False

    password_hash = await hash_password(user.password)

    updated_at = datetime.now()
    created_at = updated_at

    new_user = User(
        full_name=user.full_name,
        username=user.username,
        password_hash=password_hash,
        role=user.role,
        active=user.active,
        updated_at=updated_at,
        created_at=created_at,
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)

    return new_user
