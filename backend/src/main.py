import uvicorn
from fastapi import FastAPI
from authx import AuthX, AuthXConfig
from fastapi.middleware.cors import CORSMiddleware

from backend.src.config import JWT_SECRET_KEY, JWT_ACCESS_COOKIE_NAME
from backend.src.database import init_db

from backend.src.users.routers import router as user_router
from backend.src.patients.routers import router as patient_router
from backend.src.schedules.routers import router as schedule_router
from backend.src.schedules_times.routers import router as schedule_times_router
from backend.src.prescriptions.routers import router as prescriptions_router
from backend.src.pillboxes.routers import router as pillboxes_router
from backend.src.alerts.routers import router as alerts_router


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
app.include_router(pillboxes_router)
app.include_router(alerts_router)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173"],  # 👈 Точный origin, откуда открыт фронтенд
    allow_credentials=True,                   # 👈 Обязательно True для кук
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/init_db")
async def initialize_database():
    await init_db()
    return {"message": "База данных инициализирована"}


if __name__ == "__main__":
    uvicorn.run("backend.src.main:app", host='0.0.0.0', port=8000,reload=True)