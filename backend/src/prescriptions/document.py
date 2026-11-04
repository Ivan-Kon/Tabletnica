"""Atomic paper prescription contract used by the nurse frontend.

Prescription schedules exist before a device/cell assignment. They must not be
stored in device schedules, which require cell_config_id.
"""
from datetime import UTC, date, datetime
from typing import Literal
import re
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, AliasChoices, field_validator, model_validator
from sqlalchemy import ForeignKey, JSON, Text, select
from sqlalchemy.orm import Mapped, mapped_column
from backend.src.auth import current_user
from backend.src.database import Base
from backend.src.dependencies import SessionDep
from backend.src.patients.models import Patient
from backend.src.prescriptions.models import Prescription
from backend.src.prescriptions_items.models import PrescriptionItem

class PrescriptionItemPlan(Base):
    __tablename__ = "prescription_item_plans"
    item_id: Mapped[int] = mapped_column(ForeignKey("prescriptions_items.id", ondelete="CASCADE"), primary_key=True)
    schedule: Mapped[dict] = mapped_column(JSON)
    comment: Mapped[str] = mapped_column(Text, default="")

class ScheduleInput(BaseModel):
    schedule_type: Literal["SPECIFIC_TIME", "INTERVAL"]
    specific_times: list[str] = Field(default_factory=list, max_length=48)
    interval_minutes: int | None = None
    anchor_at: datetime | None = None

    @field_validator("anchor_at", mode="before")
    @classmethod
    def empty_anchor(cls, value):
        return None if value == "" else value

    @model_validator(mode="after")
    def validate_mode(self):
        if self.schedule_type == "SPECIFIC_TIME":
            if not self.specific_times or len(set(self.specific_times)) != len(self.specific_times):
                raise ValueError("Укажите разные времена выдачи")
            if any(not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", value) for value in self.specific_times):
                raise ValueError("Время выдачи должно быть в формате ЧЧ:ММ")
            self.interval_minutes = None
            self.anchor_at = None
        else:
            if self.interval_minutes is None or self.interval_minutes <= 0 or self.anchor_at is None:
                raise ValueError("Укажите положительный интервал и начало отсчёта")
            if self.anchor_at.utcoffset() is None:
                raise ValueError("Укажите часовой пояс начала отсчёта")
            self.specific_times = []
        return self

class ItemInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    drug_name: str = Field(min_length=1, max_length=255)
    dosage: str = Field(min_length=1, max_length=255)
    quantity: float = Field(gt=0, le=999999999, allow_inf_nan=False)
    dosage_form: str = Field(default="таблетка", min_length=1, max_length=45)
    start_date: date
    end_date: date | None = None
    comment: str = Field(default="", max_length=2000)
    schedule: ScheduleInput

    @field_validator("end_date", mode="before")
    @classmethod
    def empty_end(cls, value):
        return None if value == "" else value

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("Дата окончания должна быть не раньше даты начала")
        return self

class DocumentInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    patient_id: int = Field(gt=0)
    prescribed_by: str = Field(min_length=1, max_length=100,
        validation_alias=AliasChoices("prescribed_by", "doctor_name"))

    @model_validator(mode="before")
    @classmethod
    def consistent_doctor(cls, value):
        if isinstance(value, dict) and "prescribed_by" in value and "doctor_name" in value:
            if value["prescribed_by"] != value["doctor_name"]:
                raise ValueError("Переданы разные значения ФИО врача")
        return value
    items: list[ItemInput] = Field(min_length=1, max_length=100)

class DocumentOut(BaseModel):
    id: int
    patient_id: int
    doctor_name: str
    prescribed_by: str
    entered_by: int
    source_type: str
    created_at: datetime


def document_dto(document):
    return dict(id=document.id, patient_id=document.patient_id, doctor_name=document.prescribed_by, prescribed_by=document.prescribed_by,
                entered_by=document.entered_by, source_type=document.source_type, created_at=document.created_at)

async def create_document(session, data, user):
    patient = await session.get(Patient, data.patient_id)
    if patient is None:
        raise HTTPException(404, "Пациент не найден")
    if patient.status != "active":
        raise HTTPException(409, "Назначение доступно только активному пациенту")
    now = datetime.now(UTC).replace(tzinfo=None)
    document = Prescription(patient_id=data.patient_id, entered_by=user.id,
        source_type="paper", source_document_number=None, prescribed_by=data.prescribed_by,
        status="new", created_at=now, updated_at=now)
    try:
        session.add(document)
        await session.flush()
        for value in data.items:
            item = PrescriptionItem(prescription_id=document.id, drug_name=value.drug_name,
                dosage=value.dosage, quantity=value.quantity, dosage_form=value.dosage_form,
                start_date=value.start_date, end_date=value.end_date, status="new",
                external_drug_id="", drug_source="manual", created_at=now, updated_at=now)
            session.add(item)
            await session.flush()
            session.add(PrescriptionItemPlan(item_id=item.id,
                schedule=value.schedule.model_dump(mode="json"), comment=value.comment))
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    return document_dto(document)

router = APIRouter(prefix="/frontend/v1", tags=["Frontend prescriptions"])

@router.post("/prescriptions", response_model=DocumentOut, status_code=201)
async def add_document(data: DocumentInput, session: SessionDep, user=Depends(current_user)):
    return await create_document(session, data, user)

@router.get("/prescription-items")
async def get_items(session: SessionDep, _user=Depends(current_user)):
    result = await session.execute(select(PrescriptionItem, Prescription, PrescriptionItemPlan)
        .join(Prescription, Prescription.id == PrescriptionItem.prescription_id)
        .outerjoin(PrescriptionItemPlan, PrescriptionItemPlan.item_id == PrescriptionItem.id))
    return [dict(id=item.id, prescription_id=item.prescription_id,
        drug_name=item.drug_name, dosage=item.dosage, quantity=float(item.quantity),
        dosage_form=item.dosage_form, start_date=item.start_date, end_date=item.end_date,
        status=item.status, comment=plan.comment if plan else "",
        prescription=document_dto(document),
        schedule={**plan.schedule, "id": item.id, "prescription_item_id": item.id} if plan else None)
        for item, document, plan in result.all()]
