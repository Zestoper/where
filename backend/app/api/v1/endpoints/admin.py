import uuid
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import cast
from sqlalchemy.orm import Session
from geoalchemy2 import Geometry
from geoalchemy2.functions import ST_X, ST_Y
from pydantic import BaseModel
from app.core.database import get_db
from app.core.config import settings
from app.models.report import Report
from app.models.location import Location

router = APIRouter()


def require_admin(x_admin_key: str = Header(...)):
    if x_admin_key != settings.ADMIN_KEY:
        raise HTTPException(status_code=401, detail="관리자 인증 실패")


@router.get("/reports", dependencies=[Depends(require_admin)])
def list_reports(status: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Report)
    if status:
        query = query.filter(Report.status == status)
    reports = query.order_by(Report.created_at.desc()).all()

    result = []
    for r in reports:
        item = {
            "id": str(r.id),
            "location_id": str(r.location_id) if r.location_id else None,
            "report_type": r.report_type,
            "description": r.description,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
            "location": None,
        }
        if r.location_id:
            loc = (
                db.query(
                    Location.category,
                    Location.lname,
                    Location.addr,
                    Location.is_active,
                    ST_Y(cast(Location.postgis, Geometry)).label("lat"),
                    ST_X(cast(Location.postgis, Geometry)).label("lng"),
                )
                .filter(Location.id == r.location_id)
                .first()
            )
            if loc:
                item["location"] = {
                    "category": loc.category,
                    "lname": loc.lname,
                    "addr": loc.addr,
                    "is_active": loc.is_active,
                    "lat": loc.lat,
                    "lng": loc.lng,
                }
        result.append(item)
    return result


class ApprovePayload(BaseModel):
    category: str | None = None
    lname: str | None = None
    addr: str | None = None
    lat: float | None = None
    lng: float | None = None


@router.post("/reports/{report_id}/approve", dependencies=[Depends(require_admin)])
def approve_report(report_id: uuid.UUID, payload: ApprovePayload, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="제보를 찾을 수 없습니다")

    if report.location_id:
        location = db.query(Location).filter(Location.id == report.location_id).first()
        if not location:
            raise HTTPException(status_code=404, detail="시설을 찾을 수 없습니다")

        if report.report_type == "missing":
            location.is_active = False
        else:
            if payload.category:
                location.category = payload.category
            if payload.lname:
                location.lname = payload.lname
            if payload.addr:
                location.addr = payload.addr
            if payload.lat is not None and payload.lng is not None:
                location.postgis = f"SRID=4326;POINT({payload.lng} {payload.lat})"
    else:
        if not (payload.category and payload.lname and payload.addr and payload.lat is not None and payload.lng is not None):
            raise HTTPException(status_code=400, detail="새 시설 등록에는 category/lname/addr/lat/lng가 모두 필요합니다")
        db.add(Location(
            category=payload.category,
            lname=payload.lname,
            addr=payload.addr,
            postgis=f"SRID=4326;POINT({payload.lng} {payload.lat})",
            apifrom="report",
        ))

    report.status = "resolved"
    db.commit()
    return {"detail": "승인 완료"}


@router.post("/reports/{report_id}/reject", dependencies=[Depends(require_admin)])
def reject_report(report_id: uuid.UUID, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="제보를 찾을 수 없습니다")
    report.status = "reviewed"
    db.commit()
    return {"detail": "반려 완료"}
