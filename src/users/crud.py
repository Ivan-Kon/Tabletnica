from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from src.hash import hash_password, verify_password, pwd_context
from src.users.models import User


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


async def register_user(session: AsyncSession,username, password, role, full_name) -> dict | None:
    """Регистрация пользователя в БД."""

    # Проверка на дубликат — иначе получите IntegrityError при unique constraint
    existing = await session.scalar(
        select(User).where(User.username == username)
    )
    if existing is not None:
        raise ValueError("Пользователь с таким username уже существует")

    password_hash = await hash_password(password)

    new_user = User(
        full_name=full_name,
        username=username,
        password_hash=password_hash,
        role=role,
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)   # чтобы получить id после flush

    return {"message": "Врач успешно зарегистрирован", "id": new_user.id}
