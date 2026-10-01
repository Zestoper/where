from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.email import send_email
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    create_verification_token,
    decode_verification_token,
)
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserOut, Token

router = APIRouter()


def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="인증이 필요합니다")
    token = authorization.removeprefix("Bearer ")
    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="사용자를 찾을 수 없습니다")
    return user


def send_verification_email(user: User, frontend_url: str):
    token = create_verification_token(str(user.id))
    link = f"{frontend_url}/verify-email?token={token}"
    send_email(
        user.email,
        "어딨지 이메일 인증",
        f"<p>{user.nickname}님, 아래 링크를 눌러 이메일을 인증해주세요.</p><p><a href='{link}'>{link}</a></p>",
    )


def resolve_frontend_url(request: Request) -> str:
    origin = request.headers.get("origin")
    return origin or settings.FRONTEND_URL


@router.post("/register", response_model=Token)
def register(payload: UserCreate, request: Request, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="이미 가입된 이메일입니다")
    user = User(
        email=payload.email,
        nickname=payload.nickname,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    send_verification_email(user, resolve_frontend_url(request))
    return Token(access_token=create_access_token(str(user.id)), user=user)


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 올바르지 않습니다")
    return Token(access_token=create_access_token(str(user.id)), user=user)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user_id = decode_verification_token(token)
    if not user_id:
        raise HTTPException(status_code=400, detail="유효하지 않거나 만료된 링크입니다")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    user.email_verified = True
    db.commit()
    return {"detail": "이메일 인증이 완료됐어요"}


@router.post("/resend-verification")
def resend_verification(request: Request, user: User = Depends(get_current_user)):
    if user.email_verified:
        return {"detail": "이미 인증된 이메일이에요"}
    send_verification_email(user, resolve_frontend_url(request))
    return {"detail": "인증 메일을 다시 보냈어요"}
