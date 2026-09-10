from typing import Annotated

import uvicorn
from fastapi import FastAPI, Request, Depends, HTTPException, Response
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from authx import AuthX, AuthXConfig

from SQL import get_session, init_db, Patient, AsyncSession, Doctor
import requests as rq
from schema import PatientSchema, PersonalSchema


# authx
config = AuthXConfig()
config.JWT_SECRET_KEY = "SECRET_KEY"
config.JWT_ACCESS_COOKIE_NAME = "my_access_token"
config.JWT_TOKEN_LOCATION = ["cookies"]

security = AuthX(config=config)


SessionDep = Annotated[AsyncSession, Depends(get_session)]

app = FastAPI(title="Одностраничное приложение")
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.post("/login")
async def login(creds: PersonalSchema, response: Response,session: SessionDep):
    login_success = await rq.login_doctor(session, creds.username, creds.password)
    if login_success:
        token = security.create_access_token(uid="12345")
        response.set_cookie(config.JWT_ACCESS_COOKIE_NAME, token)
        return {"access_token": token}
    raise HTTPException(status_code=401, detail="Incorrect Password or email")


@app.get("/register/doctor")
async def register_doctor(request: Request):
    return templates.TemplateResponse(request=request, name="register_personal.html", context={})


@app.get("/register/patient")
async def register_patient(request: Request):
    return templates.TemplateResponse(request=request, name="register_patient.html", context={})



@app.post("/add_patient")
async def add_patient(data: PatientSchema, session: SessionDep):
    new_patient = Patient(
        name=data.name,
        birth_date=data.birth_date,
        id_doctor=data.id_doctor,
        num_room=data.num_room,
    )
    session.add(new_patient)
    await session.commit()
    return {"message": "Пациент успешно зарегистрирован"}


@app.post("/init_db")
async def initialize_database():
    await init_db()
    return {"message": "База данных инициализирована"}


@app.get('/protected', dependencies=[Depends(security.access_token_required)])
async def protected():
    return {"data": "TOP SECRET"}


@app.post("/add_personal")
async def add_patient(data: PersonalSchema, session: SessionDep):
    if data.job_title == "Врач":
        new_personal = Doctor(
            name=data.name,
            username=data.username,
            password=data.password,
        )
        session.add(new_personal)
        await session.commit()
        return {"message": "Врач успешно зарегистрирован"}
    return {"error": "error"}


if __name__ == "__main__":
    uvicorn.run("app:app", reload=True)