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


async def init_db(drop_first: bool = True):
    async with engine.begin() as conn:
        if drop_first:
            # Отключаем проверку внешних ключей (актуально для MySQL/MariaDB)
            await conn.execute(text("SET FOREIGN_KEY_CHECKS = 0"))

            # Удаляем все таблицы через Base
            await conn.run_sync(Base.metadata.drop_all)

            # Включаем проверку внешних ключей обратно
            await conn.execute(text("SET FOREIGN_KEY_CHECKS = 1"))

        # Создаем все таблицы, описанные в моделях Base
        await conn.run_sync(Base.metadata.create_all)
        with open("database.sql", "r", encoding="utf-8") as f:
            sql = f.read()
        conn.execute(text(sql))
        #await conn.run_sync(Base.metadata.create_all)
