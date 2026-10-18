from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.src.alerts.models import Alert


async def get_alerts(session: AsyncSession) -> List[Alert]:
    """Получение всех пациентов"""
    alerts = await session.execute(select(Alert))
    return alerts.scalars().all()


async def get_alert(session: AsyncSession, alert_id: Alert.id) -> Alert | None:
    alert = await session.get(Alert,alert_id)
    if alert:
        return alert
    return None


# async def add_patient(session: AsyncSession,patient: Alert) -> Alert:
#     """Добавление нового пациента"""
#     created_at = datetime.now()
#     updated_at = created_at
#
#     new_patient = Alert(
#         full_name=patient.full_name,
#         room_number=patient.room_number,
#         bed_number=patient.bed_number,
#         status=patient.status,
#         created_at=created_at,
#         updated_at=updated_at,
#     )
#     session.add(new_patient)
#     await session.commit()
#     await session.refresh(new_patient)
#     return new_patient
#
#
# async def update_status_patient(session: AsyncSession,patient_id: Alert.id, patient_status: Patient.status) -> Patient | None:
#     """Обновление статуса пациента"""
#     patient = await session.get(Alert,patient_id)
#     if patient:
#         update_at = datetime.now()
#         patient.updated_at = update_at
#         patient.status = patient_status
#         await session.commit()
#         await session.refresh(patient)
#         return patient
#     return None
#
#
#
#
# async def delete_patient(session: AsyncSession, patient_id: Alert.id) -> bool:
#
#     patient = await session.get(Alert,patient_id)
#     if patient:
#         await session.delete(patient)
#         await session.commit()
#         return patient
#     return False
