import uuid
from sqlalchemy import Column, String, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base

class User(Base):
    __tablename__ = "user"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    nickname = Column(String(30), nullable=False)
    password_hash = Column(String(60), nullable=False)
    email_verified = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
