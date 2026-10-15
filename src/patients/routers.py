from typing import List
from fastapi import APIRouter, HTTPException, status

from src.patients.schemas import PatientSchema, PatientOutSchema, StatusPatientSchema
from src.patients.crud import get_patients, get_patient, add_patient, update_status_patient, delete_patient
from src.session import SessionDep

router = APIRouter(
    prefix="/patients",
    tags=["patients"],
)


@router.get("/get_all", summary="Получить всех пациентов",status_code=status.HTTP_200_OK,response_model=List[PatientOutSchema])
async def get_patients_from_db(session: SessionDep):
    """Получить всех пациентов"""
    patients = await get_patients(session)
    return patients


@router.get("/get/{patient_id}", summary="Получить одного пациента",status_code=status.HTTP_200_OK,response_model=PatientOutSchema)
async def get_patient_from_db(patient_id: int,session: SessionDep) -> PatientOutSchema:
    """Получить одного пациента"""
    patient = await get_patient(session, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


@router.post("/add", summary="Добавить нового пациента",status_code=status.HTTP_201_CREATED,response_model=PatientOutSchema)
async def add_patient_to_db(patient: PatientSchema,session: SessionDep) -> PatientOutSchema:
    """Добавить нового пациента"""
    patient = await add_patient(session, patient)
    return patient


@router.patch("/update_status/{patient_id}",summary="Обновить статус пациента",status_code=status.HTTP_202_ACCEPTED,response_model=PatientOutSchema)
async def change_status_patient(patient_id: int,patient: StatusPatientSchema,session: SessionDep) -> PatientOutSchema:
    """Обновить статуса пациента"""
    patient = await update_status_patient(session, patient_id, patient.status)
    if patient:
        return patient
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")


@router.delete("/delete/{patient_id}", summary="Удалить пациента",status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient_from_db(patient_id: int,session: SessionDep):
    """Удалить пациента"""
    patient = await delete_patient(session, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")