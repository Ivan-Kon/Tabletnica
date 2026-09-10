import asyncio
from datetime import date

from sqlalchemy import ForeignKey, String, BigInteger, Date, Integer
from sqlalchemy.orm import Mapped, DeclarativeBase, mapped_column
from sqlalchemy.ext.asyncio import AsyncAttrs, async_sessionmaker, create_async_engine, AsyncSession


DATABASE_URL = "mysql+asyncmy://root:password@localhost:3306/my_database"

engine = create_async_engine(url=DATABASE_URL, echo=True)

async_session = async_sessionmaker(bind=engine, expire_on_commit=False)


async def get_session():
    async with async_session() as session:
        yield session


class Base(AsyncAttrs, DeclarativeBase):
    pass


class Patient(Base):
    __tablename__ = 'patients'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    birth_date: Mapped[date] = mapped_column(Date)
    id_doctor: Mapped[int] = mapped_column(ForeignKey("doctors.id"))
    num_room: Mapped[int] = mapped_column(Integer)




class Doctor(Base):
    __tablename__ = 'doctors'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    username: Mapped[str] = mapped_column(String(128))
    password: Mapped[str] = mapped_column(String(128))


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

