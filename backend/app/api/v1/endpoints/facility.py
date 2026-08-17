from fastapi import APIRouter, Query, Depends
from sqlalchemy import cast
from sqlalchemy.orm import Session
from geoalchemy2 import Geometry
from geoalchemy2.functions import ST_DWithin, ST_MakePoint, ST_SetSRID, ST_X, ST_Y
from app.core.database import get_db
from app.models.location import Location
from app.schemas.location import LocationOut

router = APIRouter()

@router.get("/nearby", response_model=list[LocationOut])
def get_nearby_facilities(
    lat: float,
    lng: float,
    radius: int = 500,
    db: Session = Depends(get_db),
):
    point = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    rows = (
        db.query(
            Location.id,
            Location.category,
            Location.lname,
            Location.addr,
            ST_Y(cast(Location.postgis, Geometry)).label("lat"),
            ST_X(cast(Location.postgis, Geometry)).label("lng"),
        )
        .filter(ST_DWithin(Location.postgis, point, radius))
        .all()
    )
    return rows
