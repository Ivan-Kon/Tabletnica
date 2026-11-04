from datetime import UTC, datetime, timedelta
import secrets
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import delete
from backend.src.auth import UserSession, token_hash, current_user, admin_user, verify_origin
from backend.src.config import JWT_ACCESS_COOKIE_NAME, COOKIE_SECURE
from backend.src.users.schemas import LoginUserSchema, UserSchema, UserOutSchema
from backend.src.users.crud import login_user, register_user
from backend.src.dependencies import SessionDep

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/login", response_model=UserOutSchema)
async def login(data: LoginUserSchema, session: SessionDep, response: Response, request: Request):
    verify_origin(request)
    user = await login_user(session, data.username, data.password)
    if user is None or not user.active:
        raise HTTPException(401, "Incorrect username or password")
    old = request.cookies.get(JWT_ACCESS_COOKIE_NAME)
    if old:
        await session.execute(delete(UserSession).where(UserSession.token_hash == token_hash(old)))
    await session.execute(delete(UserSession).where(UserSession.expires_at <= datetime.now(UTC).replace(tzinfo=None)))
    token = secrets.token_urlsafe(32)
    session.add(UserSession(token_hash=token_hash(token), user_id=user.id,
                           expires_at=datetime.now(UTC).replace(tzinfo=None) + timedelta(days=1)))
    await session.commit()
    response.set_cookie(JWT_ACCESS_COOKIE_NAME, token, max_age=86400,
                        httponly=True, secure=COOKIE_SECURE, samesite="lax", path="/")
    return user

@router.get("/me", response_model=UserOutSchema)
async def me(user=Depends(current_user)):
    return user

@router.post("/logout", status_code=204)
async def logout(request: Request, response: Response, session: SessionDep):
    verify_origin(request)
    token = request.cookies.get(JWT_ACCESS_COOKIE_NAME)
    if token:
        await session.execute(delete(UserSession).where(UserSession.token_hash == token_hash(token)))
        await session.commit()
    response.delete_cookie(JWT_ACCESS_COOKIE_NAME, path="/", secure=COOKIE_SECURE, httponly=True, samesite="lax")

@router.post("/register", response_model=UserOutSchema, status_code=201)
async def register(data: UserSchema, session: SessionDep, _admin=Depends(admin_user)):
    user = await register_user(session, data)
    if not user:
        raise HTTPException(409, "Username already exists")
    return user
