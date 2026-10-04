from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncAttrs
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from src.config import DATABASE_URL

engine = create_async_engine(url=DATABASE_URL)

async_session = async_sessionmaker(bind=engine, expire_on_commit=False)


async def get_session():
    async with async_session() as session:
        yield session


class Base(AsyncAttrs, DeclarativeBase):
    pass


async def init_db(drop_first: bool = False):
    with open("database.sql", "r", encoding="utf-8") as file:
        sql_script = file.read()

    statements = [s.strip() for s in sql_script.split(";") if s.strip()]

    async with engine.begin() as conn:
        if drop_first:
            await conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
            await conn.run_sync(Base.metadata.drop_all)
            await conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))

        for i, stmt in enumerate(statements, 1):
            await conn.execute(text(stmt))
