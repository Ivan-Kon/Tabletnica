from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class PrescriptionStatus(str, Enum):
    new = 'new'
    pending_setup = 'pending_setup'
    configured = 'configured'
    active = 'active'
    paused = 'paused'
    completed = 'completed'


class PrescriptionSourceType(str, Enum):
    paper = 'paper'
    papper = 'papper'
    imported = 'import'
    manual = 'manual'


class PrescriptionStatusSchema(BaseModel):
    status: PrescriptionStatus


class PrescriptionSchema(PrescriptionStatusSchema):

    patient_id: int
    entered_by: int
    source_type: PrescriptionSourceType
    source_document_number: int | None = None
    prescribed_by: str


class PrescriptionOutSchema(PrescriptionSchema):
    id: int
    created_at: datetime
    updated_at: datetime

