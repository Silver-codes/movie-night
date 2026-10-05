from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, col, select

from app.db import get_session
from app.models import Movie
from app.tmdb import TMDBClient, TMDBSearchResult, get_tmdb

router = APIRouter(tags=["search"])


class SearchResult(TMDBSearchResult):
    already_saved: bool


@router.get("/search")
async def search(
    q: Annotated[str, Query(min_length=1, max_length=200)],
    tmdb: Annotated[TMDBClient, Depends(get_tmdb)],
    session: Annotated[Session, Depends(get_session)],
) -> list[SearchResult]:
    if not q.strip():
        return []
    results = await tmdb.search_movies(q)
    # Not cached: a movie saved a moment ago must show up as saved right away.
    ids = [result.tmdb_id for result in results]
    saved = set(session.exec(select(Movie.tmdb_id).where(col(Movie.tmdb_id).in_(ids))).all())
    return [
        SearchResult(**result.model_dump(), already_saved=result.tmdb_id in saved)
        for result in results
    ]
