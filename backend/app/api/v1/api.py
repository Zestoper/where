from fastapi import APIRouter
from app.api.v1.endpoints import facility, report, favorite

api_router = APIRouter()
api_router.include_router(facility.router, prefix="/facilities", tags=["facilities"])
api_router.include_router(report.router, prefix="/reports", tags=["reports"])
api_router.include_router(favorite.router, prefix="/favorites", tags=["favorites"])