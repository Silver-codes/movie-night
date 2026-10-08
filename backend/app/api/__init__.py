from fastapi import APIRouter

from app.api import health, history, movies, people, picks, search

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(search.router)
api_router.include_router(movies.router)
api_router.include_router(picks.router)
api_router.include_router(history.router)
api_router.include_router(people.router)
