from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from sqlmodel import Session

from app import db
from app.api import api_router
from app.api.picks import delete_unconfirmed_picks
from app.config import get_settings
from app.frontend import FRONTEND_DIST, mount_frontend
from app.tmdb import TMDBClient, TMDBError


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    db.create_db_and_tables()
    with Session(db.engine) as session:
        delete_unconfirmed_picks(session)
    app.state.tmdb = TMDBClient(get_settings().tmdb_token)
    yield
    await app.state.tmdb.aclose()


app = FastAPI(title="Movie Night API", lifespan=lifespan)
# Compresses JSON and the built JS/CSS (several times smaller on the phone).
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.include_router(api_router, prefix="/api")
# Production mode: serve the built frontend (registered last, so /api and /docs win).
if (FRONTEND_DIST / "index.html").is_file():
    mount_frontend(app, FRONTEND_DIST)


@app.exception_handler(TMDBError)
async def tmdb_error_handler(_: Request, exc: TMDBError) -> JSONResponse:
    return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)
