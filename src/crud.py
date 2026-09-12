from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import Patient, Doctor


async def add_patient(session: AsyncSession, name, birth_date, id_doctor, num_room, id_user=None):
    patient = await session.scalar(select(Patient).where(Patient.id == id_user))
    if patient:
        return None

    new_patient = Patient(
        name=name,
        birth_date=birth_date,
        id_doctor=id_doctor,
        num_room=num_room,
    )
    session.add(new_patient)
    await session.commit()
    await session.refresh(new_patient)
    return new_patient


async def login_doctor(session: AsyncSession, username, password):
    doctor = await session.scalar(
        select(Doctor).where(Doctor.username == username, Doctor.password == password)
    )
    if doctor:
        return True
    return False


async def get_patient(session: AsyncSession, id_doctor):
    pass