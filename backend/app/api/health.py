from fastapi import APIRouter
from pydantic import BaseModel

from app.config import get_settings

router = APIRouter(tags=["health"])


class HealthResponse(BaseModel):
    status: str
    tmdb_configured: bool


@router.get("/health")
def health() -> HealthResponse:
    return HealthResponse(status="ok", tmdb_configured=bool(get_settings().tmdb_token))
