from sqlalchemy import select, update, delete, func
from SQL import get_session, Patient, Doctor, AsyncSession
from typing import List


async def add_patient(session: AsyncSession,name,birth_date,id_doctor,num_room,id_user=None):
    patient = await session.scalar(select(Patient).where(Patient.id == id_user))
    if patient:
        return None
        
    new_patient = Patient(name=name,birth_date=birth_date,id_doctor=id_doctor,num_room=num_room)
    session.add(new_patient)
    await session.commit()
    await session.refresh(new_patient)
    return new_patient

async def login_doctor(session: AsyncSession,username,password):
    doctor = await session.scalar(select(Doctor).where(Doctor.username == username, Doctor.password == password))
    if doctor:
        return True
    return False


"""async def get_tasks(user_id):
    async with async_session() as session:
        tasks = await session.scalars(
            select(Task).where(Task.user == user_id, Task.completed == False)
        )
        
        serialized_tasks = [
            TaskSchema.model_validate(t).model_dump() for t in tasks
        ]
        
        return serialized_tasks"""


"""async def get_completed_tasks_count(user_id):
    async with async_session() as session:
        return await session.scalar(select(func.count(Task.id)).where(Task.completed == True))
"""

"""async def add_task(user_id, title):
    async with async_session() as session:
        new_task = Task(
            title=title,
            user=user_id
        )
        session.add(new_task)
        await session.commit()"""


"""async def update_task(task_id):
    async with async_session() as session:
        await session.execute(update(Task).where(Task.id == task_id).values(completed=True))
        await session.commit()"""
