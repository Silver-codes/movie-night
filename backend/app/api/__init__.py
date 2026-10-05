from fastapi import APIRouter

from app.api import health, movies, search

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(search.router)
api_router.include_router(movies.router)
