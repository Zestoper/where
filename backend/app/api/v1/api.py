from fastapi import APIRouter
from app.api.v1.endpoints import facilities

api_router = APIRouter()
api_router.include_router(facilities.router,prefix="/facilities", tags=["facilities"])
