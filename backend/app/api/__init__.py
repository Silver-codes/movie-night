from fastapi import APIRouter

from app.api import health, search

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(search.router)
