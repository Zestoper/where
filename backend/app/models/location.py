import uuid
from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geography
from app.core.database import Base

class Location(Base):
    __tablename__ = "location"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category = Column(String(20), nullable=False)
    lname = Column(String(50), nullable=False)
    addr = Column(String(50), nullable=False)
    postgis = Column(Geography(geometry_type="POINT", srid=4326), nullable=False)
    apifrom = Column(String(30), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    cr_clock = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    up_clock = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
