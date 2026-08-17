import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class Favorite(Base):
    __tablename__ = "favorite"
    __table_args__ = (UniqueConstraint("location_id", "device_id"),)

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(UUID(as_uuid=True), ForeignKey("location.id", ondelete="CASCADE"), nullable=False)
    device_id = Column(String(50), nullable=False)
    create_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    