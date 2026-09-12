from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncAttrs
from sqlalchemy.orm import DeclarativeBase

from src.config import DATABASE_URL

engine = create_async_engine(url=DATABASE_URL, echo=True)

async_session = async_sessionmaker(bind=engine, expire_on_commit=False)


async def get_session():
    async with async_session() as session:
        yield session


class Base(AsyncAttrs, DeclarativeBase):
    pass


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)