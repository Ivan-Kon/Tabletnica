from fastapi import APIRouter, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from src.patients.schemas import PatientOutSchema
from src.prescriptions.models import Prescription

from src.prescriptions.crud import get_prescriptions, add_prescription, get_prescription, change_status_prescription, delete_prescription
from src.prescriptions.schemas import PrescriptionOutSchema, PrescriptionSchema, PrescriptionStatusSchema

from src.session import SessionDep

router = APIRouter(
    prefix="/prescriptions",
    tags=["prescriptions"],
)


@router.get("/get_all",response_model=list[PrescriptionOutSchema],status_code=200)
async def get_all(session: SessionDep):
    prescriptions = await get_prescriptions(session)
    return prescriptions


@router.get("/get/{prescription_id}",response_model=PrescriptionOutSchema,status_code=200)
async def get_by_id(session: SessionDep, prescription_id: int):
    prescription = await get_prescription(session, prescription_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return prescription


@router.post("/add",response_model=PrescriptionOutSchema, status_code=201)
async def add(session: SessionDep,prescription: PrescriptionSchema):
    prescription = await add_prescription(session, prescription)
    return prescription


@router.patch("/update/{prescription_id}",response_model=PrescriptionOutSchema, status_code=200)
async def update(session: SessionDep,prescription_id: int, prescription: PrescriptionStatusSchema):
    prescription = await change_status_prescription(session, prescription_id, prescription.status)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return prescription


@router.delete("/delete/{prescription_id}",status_code=204)
async def delete(session: SessionDep,prescription_id: int):
    prescription = await delete_prescription(session, prescription_id)
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

