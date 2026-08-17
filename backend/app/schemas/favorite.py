from pydantic import BaseModel, ConfigDict
from datetime import datetime
import uuid

class FavoriteCreate(BaseModel):
    location_id: uuid.UUID
    device_id: str

class FavoriteOut(BaseModel):
    id: uuid.UUID
    location_id: uuid.UUID
    device_id: str
    create_at: datetime

    model_config = ConfigDict(from_attributes=True)
