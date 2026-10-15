from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request, Depends, HTTPException, Response
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from authx import AuthX, AuthXConfig

from src.config import JWT_SECRET_KEY, JWT_ACCESS_COOKIE_NAME
from src.database import init_db
from src.patients.models import Patient
from src import crud
from src.session import SessionDep

from src.users.routers import router as user_router
from src.patients.routers import router as patient_router
from src.schedules.routers import router as schedule_router
from src.schedules_times.routers import router as schedule_times_router
from src.prescriptions.routers import router as prescriptions_router


config = AuthXConfig()
config.JWT_SECRET_KEY = JWT_SECRET_KEY
config.JWT_ACCESS_COOKIE_NAME = JWT_ACCESS_COOKIE_NAME
config.JWT_TOKEN_LOCATION = ["cookies"]

security = AuthX(config=config)


app = FastAPI(title="Сайт для Больницы Пирогова")

app.include_router(user_router)
app.include_router(schedule_router)
app.include_router(patient_router)
app.include_router(schedule_times_router)
app.include_router(prescriptions_router)


@app.post("/init_db")
async def initialize_database():
    await init_db()
    return {"message": "База данных инициализирована"}


if __name__ == "__main__":
    uvicorn.run("src.main:app", reload=True)