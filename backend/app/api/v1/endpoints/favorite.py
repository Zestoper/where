from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.database import get_db
from app.models.favorite import Favorite
from app.schemas.favorite import FavoriteCreate, FavoriteOut

router = APIRouter()

@router.post("/", response_model=FavoriteOut)
def add_favorite(payload: FavoriteCreate, db: Session = Depends(get_db)):
    favorite = Favorite(location_id=payload.location_id, device_id=payload.device_id)
    db.add(favorite)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="이미 즐겨찾기한 시설입니다")
    db.refresh(favorite)
    return favorite

@router.get("/", response_model=list[FavoriteOut])
def list_favorites(device_id: str, db: Session = Depends(get_db)):
    return db.query(Favorite).filter(Favorite.device_id == device_id).all()

@router.delete("/")
def remove_favorite(location_id: str, device_id: str, db: Session = Depends(get_db)):
    favorite = (
        db.query(Favorite)
        .filter(Favorite.location_id == location_id, Favorite.device_id == device_id)
        .first()
    )
    if favorite is None:
        raise HTTPException(status_code=404, detail="즐겨찾기를 찾을 수 없습니다")
    db.delete(favorite)
    db.commit()
    return {"detail": "삭제되었습니다"}
