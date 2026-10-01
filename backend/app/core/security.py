import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from app.core.config import settings

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("purpose") is not None:
            return None
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


def create_verification_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "purpose": "verify_email",
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_verification_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("purpose") != "verify_email":
            return None
        return payload.get("sub")
    except jwt.PyJWTError:
        return None
