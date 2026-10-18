
from passlib.context import CryptContext
from fastapi.concurrency import run_in_threadpool

pwd_context = CryptContext(
    schemes=["argon2", "bcrypt"],   # argon2 — новый, bcrypt — для старых хешей
    deprecated=["bcrypt"],
    argon2__time_cost=2,
    argon2__memory_cost=102400,     # 100 MB
    argon2__parallelism=8,
)


async def hash_password(password: str) -> str:
    """Хеширование при регистрации."""
    return await run_in_threadpool(pwd_context.hash, password)


async def verify_password(password: str, hashed: str) -> bool:
    """Проверка пароля против хеша из БД."""
    return await run_in_threadpool(pwd_context.verify, password, hashed)
