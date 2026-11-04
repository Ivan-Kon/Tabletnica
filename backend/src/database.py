from importlib import import_module
from sqlalchemy import event
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine, AsyncAttrs
from sqlalchemy.orm import DeclarativeBase
from backend.src.config import DATABASE_URL

engine = create_async_engine(DATABASE_URL)
async_session = async_sessionmaker(bind=engine, expire_on_commit=False)

if engine.dialect.name == "sqlite":
    @event.listens_for(engine.sync_engine, "connect")
    def enable_foreign_keys(connection, _record):
        cursor = connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

async def get_session():
    async with async_session() as session:
        yield session

class Base(AsyncAttrs, DeclarativeBase):
    pass

def load_models():
    for name in ("users", "patients", "prescriptions", "prescriptions_items", "pillboxes",
                 "pillboxes_assignments", "cells", "cells_configs", "schedules",
                 "schedules_times", "events", "alerts", "devices_configs", "weight_measurements"):
        import_module(f"backend.src.{name}.models")
    import_module("backend.src.auth")
    import_module("backend.src.prescriptions.document")

async def init_db(drop_first: bool = False):
    """Create missing tables only. Existing schemas require explicit migrations."""
    if drop_first:
        raise ValueError("Destructive database initialization is disabled")
    load_models()
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
