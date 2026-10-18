from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.prescriptions.models import Prescription


async def get_prescriptions(session: AsyncSession) -> list[Prescription]:
    prescriptions = await session.execute(select(Prescription))
    return prescriptions.scalars().all()


async def get_prescription(session: AsyncSession, patient_id: int) -> Prescription:
    prescription = await session.get(Prescription, patient_id)
    if not prescription:
        return None
    return prescription


async def add_prescription(session: AsyncSession,prescription: Prescription):
    created_at = datetime.now()
    updated_at = created_at

    new_prescription = Prescription(
        patient_id=prescription.patient_id,
        entered_by=prescription.entered_by,
        source_type=prescription.source_type,
        source_document_number=prescription.source_document_number,
        prescribed_by=prescription.prescribed_by,
        status=prescription.status,
        created_at=created_at,
        updated_at=updated_at,
    )
    session.add(new_prescription)
    await session.commit()
    await session.refresh(new_prescription)
    return new_prescription


async def change_status_prescription(session: AsyncSession,prescription_id: Prescription.id,prescription_status: Prescription.status):
    prescription = await session.get(Prescription, prescription_id)
    if prescription:
        update_at = datetime.now()
        prescription.updated_at = update_at
        prescription.status = prescription_status
        await session.commit()
        await session.refresh(prescription)
        return prescription
    return None


async def delete_prescription(session: AsyncSession,prescription_id: Prescription.id):
    prescription = await session.get(Prescription, prescription_id)
    if prescription:
        await session.delete(prescription)
        await session.commit()
        return prescription
    return False
