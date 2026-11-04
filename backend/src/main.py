import uvicorn
from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from backend.src.auth import current_user
from backend.src.config import CORS_ORIGINS
from backend.src.database import load_models
from backend.src.users.routers import router as user_router
from backend.src.patients.routers import router as patient_router
from backend.src.schedules.routers import router as schedule_router
from backend.src.schedules_times.routers import router as schedule_times_router
from backend.src.prescriptions.routers import router as prescriptions_router
from backend.src.pillboxes.routers import router as pillboxes_router
from backend.src.alerts.routers import router as alerts_router

from backend.src.prescriptions.document import router as document_router

load_models()
app = FastAPI(title="Умная таблетница")
app.include_router(user_router)
app.include_router(document_router)
for router in (patient_router, schedule_router, schedule_times_router,
               prescriptions_router, pillboxes_router, alerts_router):
    app.include_router(router, dependencies=[Depends(current_user)])
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS,
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.exception_handler(IntegrityError)
async def integrity_error(_request: Request, _error: IntegrityError):
    return JSONResponse(status_code=409, content={"detail": "Запись конфликтует с существующими данными или связями."})

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run("backend.src.main:app", host="127.0.0.1", port=8000)
