from pydantic import BaseModel, ConfigDict
import uuid

class LocationOut(BaseModel):
    id: uuid.UUID
    category: str
    lname: str
    addr: str
    lat: float
    lng: float

    model_config = ConfigDict(from_attributes=True)
