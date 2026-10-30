from typing import Annotated, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException, Cookie
from backend.src.database import get_session
from backend.src.users.crud import get_user_by_session_id

SessionDep = Annotated[AsyncSession, Depends(get_session)]


async def verify_session_cookie(session: SessionDep, session_id: Optional[str] = Cookie(None)) -> str:
    # Проверяем, существует ли кука с именем 'session_token'
    print("isajdfksjafosdhfjsadhfpjasdhfjhfsdj")
    if not session_id:
        raise HTTPException(
            status_code=401,
            detail="Доступ запрещен: отсутствует сессионная кука."
        )

    # (Опционально) Здесь можно добавить проверку валидности токена (например, в базе данных или JWT)
    if not await get_user_by_session_id(session, session_id):
        raise HTTPException(
            status_code=403,
            detail="Доступ запрещен: невалидный токен."
        )

    return session_id
