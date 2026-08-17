from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.report import Report
from app.schemas.report import ReportCreate, ReportOut

router = APIRouter()

@router.post("/", response_model=ReportOut)
def create_report(payload: ReportCreate, db: Session = Depends(get_db)):
    new_coords = None
    if payload.new_lat is not None and payload.new_lng is not None:
        new_coords = f"SRID=4326;POINT({payload.new_lng} {payload.new_lat})"

    report = Report(
        location_id=payload.location_id,
        report_type=payload.report_type,
        new_category=payload.new_category,
        new_coords=new_coords,
        description=payload.description,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
