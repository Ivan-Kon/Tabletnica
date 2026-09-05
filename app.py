from urllib import request

from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Создаём экземпляр приложения
app = FastAPI(title="Одностраничное приложение")

# Подключаем папку со статикой (CSS, JS, изображения)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Настраиваем шаблонизатор Jinja2
templates = Jinja2Templates(directory="templates")

# Модель данных для входящего JSON (имя пользователя)
class UserInput(BaseModel):
    name: str


# API-эндпоинт, который вызывается через fetch с фронтенда
@app.get("/")
async def greet(user: UserInput):
    # Здесь может быть любая бизнес-логика
    greeting = f"Привет, {user.name}! Добро пожаловать в FastAPI SPA."
    return {"message": greeting}

@app.get("/login")
async def login(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})
    #return {"message": "OK"}