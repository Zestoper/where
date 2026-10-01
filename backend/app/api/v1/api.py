from fastapi import APIRouter
from app.api.v1.endpoints import facility, report, favorite, search, admin, auth

api_router = APIRouter()
api_router.include_router(facility.router, prefix="/facilities", tags=["facilities"])
api_router.include_router(report.router, prefix="/reports", tags=["reports"])
api_router.include_router(favorite.router, prefix="/favorites", tags=["favorites"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])