from pydantic import BaseModel, ConfigDict
import uuid
from datetime import datetime

class ReportCreate(BaseModel):
    location_id: uuid.UUID | None = None
    report_type: str
    new_category: str | None = None
    new_lat: float | None = None
    new_lng: float | None = None
    description: str | None = None

class ReportOut(BaseModel):
    id: uuid.UUID
    location_id: uuid.UUID | None
    report_type: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)