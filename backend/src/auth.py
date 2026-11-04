from datetime import UTC, datetime
from hashlib import sha256
from fastapi import Depends, HTTPException, Request
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column
from backend.src.config import JWT_ACCESS_COOKIE_NAME, CORS_ORIGINS
from backend.src.database import Base
from backend.src.session import SessionDep
from backend.src.users.models import User

class UserSession(Base):
    __tablename__ = "user_sessions"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    expires_at: Mapped[datetime] = mapped_column(DateTime)

def token_hash(value):
    return sha256(value.encode()).hexdigest()

def verify_origin(request: Request):
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        origin = request.headers.get("origin")
        if origin and origin not in CORS_ORIGINS:
            raise HTTPException(403, "Origin is not allowed")

async def current_user(request: Request, session: SessionDep):
    verify_origin(request)
    token = request.cookies.get(JWT_ACCESS_COOKIE_NAME)
    record = await session.get(UserSession, token_hash(token)) if token else None
    if record is None or record.expires_at <= datetime.now(UTC).replace(tzinfo=None):
        raise HTTPException(401, "Authentication required")
    user = await session.get(User, record.user_id)
    if user is None or not user.active:
        raise HTTPException(401, "Authentication required")
    return user

async def admin_user(user=Depends(current_user)):
    if user.role != "admin":
        raise HTTPException(403, "Administrator access required")
    return user
