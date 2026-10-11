from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, col, select

from app.db import get_session
from app.models import Movie
from app.tmdb import TMDBClient, TMDBMovieInfo, TMDBSearchResult, get_tmdb

router = APIRouter(tags=["search"])


class SearchResult(TMDBSearchResult):
    already_saved: bool
    # The saved movie's id, so a saved result opens the watchlist drawer.
    movie_id: int | None


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
    saved = dict(
        session.exec(select(Movie.tmdb_id, Movie.id).where(col(Movie.tmdb_id).in_(ids))).all()
    )
    return [
        SearchResult(
            **result.model_dump(),
            already_saved=result.tmdb_id in saved,
            movie_id=saved.get(result.tmdb_id),
        )
        for result in results
    ]


@router.get("/tmdb/movies/{tmdb_id}")
async def tmdb_movie_info(
    tmdb_id: int, tmdb: Annotated[TMDBClient, Depends(get_tmdb)]
) -> TMDBMovieInfo:
    """Live TMDB details for the movie drawer (cached for an hour): runtime, genres, credits, trailer…"""
    return await tmdb.get_movie_info(tmdb_id)
