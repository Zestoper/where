from pydantic import BaseModel, EmailStr, ConfigDict
import uuid

class UserCreate(BaseModel):
    email: EmailStr
    nickname: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    nickname: str
    email_verified: bool

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
