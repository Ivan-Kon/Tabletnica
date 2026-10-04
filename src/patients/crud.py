from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.patients.models import Patient


async def get_patients(session: AsyncSession) -> List[Patient]:
    """Получение всех пациентов"""
    patients = await session.execute(select(Patient))
    return patients.scalars().all()


async def add_patient(session: AsyncSession,patient: Patient) -> Patient:
    """Добавление нового пациента"""
    new_patient = Patient(
        full_name=patient.full_name,
        room_number=patient.room_number,
        bed_number=patient.bed_number,
        status=patient.status,
        created_at=patient.created_at,
        updated_at=patient.updated_at,
    )
    session.add(new_patient)
    await session.commit()
    await session.refresh(new_patient)
    return new_patient


async def update_status_patient(session: AsyncSession,patient_id: Patient.id, patient_status: Patient.status) -> Patient | None:
    """Обновление статуса пациента"""
    patient = await session.get(Patient,patient_id)
    if patient:
        patient.status = patient_status
        await session.commit()
        await session.refresh(patient)
        return patient
    return None
