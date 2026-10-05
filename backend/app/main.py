from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api import api_router
from app.config import get_settings
from app.db import create_db_and_tables
from app.tmdb import TMDBClient, TMDBError


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    create_db_and_tables()
    app.state.tmdb = TMDBClient(get_settings().tmdb_token)
    yield
    await app.state.tmdb.aclose()


app = FastAPI(title="Movie Night API", lifespan=lifespan)
app.include_router(api_router, prefix="/api")


@app.exception_handler(TMDBError)
async def tmdb_error_handler(_: Request, exc: TMDBError) -> JSONResponse:
    return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)
