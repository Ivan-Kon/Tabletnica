from typing import List
from fastapi import APIRouter, HTTPException

from src.patients.schemas import PatientSchema, PatientOutSchema, StatusPatientSchema
from src.patients.crud import get_patients, add_patient, update_status_patient
from src.session import SessionDep

router = APIRouter(
    prefix="/patients",
    tags=["patients"],
)


@router.get("/get_patients", summary="Получение всех пациентов",status_code=200,response_model=List[PatientOutSchema])
async def get_patients_from_db(session: SessionDep) -> List[PatientOutSchema]:
    """Получение всех пациентов"""
    patients = await get_patients(session)
    return patients


@router.post("/add_patient", summary="Добавление пациента в бд",status_code=201,response_model=PatientOutSchema)
async def add_patient_to_db(patient: PatientSchema,session: SessionDep) -> PatientOutSchema:
    """Добавление нового пациента"""
    patient = await add_patient(session, patient)
    return patient


@router.patch("/change_status_patient/{patient_id}",summary="Обновление статуса пациента",status_code=200,response_model=PatientOutSchema)
async def change_status_patient(patient_id: int,patient: StatusPatientSchema,session: SessionDep) -> PatientOutSchema:
    """Обновление статуса пациента"""
    patient = await update_status_patient(session, patient_id, patient.status)
    if patient:
        return patient
    raise HTTPException(status_code=404, detail="Patient not found")