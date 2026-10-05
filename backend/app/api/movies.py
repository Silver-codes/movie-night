from enum import Enum
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import ColumnElement, and_, func, or_
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, col, select

from app.db import get_session
from app.models import (
    Movie,
    MovieCreate,
    MovieRead,
    MovieSave,
    MovieStatus,
    MovieUpdate,
    MovieWatched,
    Person,
    movie_night_date,
)
from app.tmdb import TMDBClient, get_tmdb

router = APIRouter(prefix="/movies", tags=["movies"])

SessionDep = Annotated[Session, Depends(get_session)]


class MovieSort(str, Enum):
    added = "added"
    title = "title"
    runtime = "runtime"
    hype_total = "hype_total"
    tmdb_rating = "tmdb_rating"


def _get_movie_or_404(session: Session, movie_id: int) -> Movie:
    movie = session.get(Movie, movie_id)
    if movie is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Movie not found")
    return movie


def _save(session: Session, movie: Movie) -> MovieRead:
    session.add(movie)
    session.commit()
    session.refresh(movie)
    return MovieRead.model_validate(movie)


def _unrated_by(person: Person) -> ColumnElement[bool]:
    # The star that is still missing depends on where the movie is: hype before, verdict after.
    hype = col(getattr(Movie, f"{person}_hype"))
    verdict = col(getattr(Movie, f"{person}_verdict"))
    return or_(
        and_(col(Movie.status) == MovieStatus.watchlist, hype.is_(None)),
        and_(col(Movie.status) == MovieStatus.watched, verdict.is_(None)),
    )


def _order_by(sort: MovieSort) -> list[ColumnElement[object]]:
    newest = [col(Movie.added_at).desc(), col(Movie.id).desc()]
    match sort:
        case MovieSort.added:
            return newest
        case MovieSort.title:
            return [func.lower(Movie.title).asc(), *newest]
        case MovieSort.runtime:
            return [col(Movie.runtime).asc().nulls_last(), *newest]
        case MovieSort.hype_total:
            total = func.coalesce(Movie.fuf_hype, 0) + func.coalesce(Movie.cookie_hype, 0)
            return [total.desc(), *newest]
        case MovieSort.tmdb_rating:
            return [col(Movie.tmdb_rating).desc().nulls_last(), *newest]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_movie(
    body: MovieSave,
    session: SessionDep,
    tmdb: Annotated[TMDBClient, Depends(get_tmdb)],
) -> MovieRead:
    already_saved = HTTPException(status.HTTP_409_CONFLICT, "Movie already saved")
    if session.exec(select(Movie.id).where(Movie.tmdb_id == body.tmdb_id)).first() is not None:
        raise already_saved
    details = await tmdb.get_movie_details(body.tmdb_id)
    data = MovieCreate.model_validate(
        {**details.model_dump(), "fuf_hype": body.fuf_hype, "cookie_hype": body.cookie_hype}
    )
    try:
        return _save(session, Movie.model_validate(data))
    except IntegrityError:
        session.rollback()
        raise already_saved from None


@router.get("")
def list_movies(
    session: SessionDep,
    status: MovieStatus | None = None,
    genre: str | None = None,
    unrated_by: Person | None = None,
    sort: MovieSort = MovieSort.added,
) -> list[MovieRead]:
    query = select(Movie)
    if status is not None:
        query = query.where(Movie.status == status)
    if genre:
        query = query.where(Movie.has_genre(genre))
    if unrated_by is not None:
        query = query.where(_unrated_by(unrated_by))
    movies = session.exec(query.order_by(*_order_by(sort))).all()
    return [MovieRead.model_validate(movie) for movie in movies]


@router.get("/{movie_id}")
def get_movie(movie_id: int, session: SessionDep) -> MovieRead:
    return MovieRead.model_validate(_get_movie_or_404(session, movie_id))


@router.patch("/{movie_id}")
def update_movie(movie_id: int, body: MovieUpdate, session: SessionDep) -> MovieRead:
    movie = _get_movie_or_404(session, movie_id)
    movie.apply_update(body)
    return _save(session, movie)


@router.post("/{movie_id}/watched")
def mark_watched(movie_id: int, body: MovieWatched, session: SessionDep) -> MovieRead:
    movie = _get_movie_or_404(session, movie_id)
    # Only the verdicts/notes that were sent; re-marking must not wipe earlier ones.
    movie.sqlmodel_update(body.model_dump(exclude_unset=True, exclude={"watched_on"}))
    movie.status = MovieStatus.watched
    movie.watched_on = body.watched_on or movie_night_date()
    return _save(session, movie)


@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movie(movie_id: int, session: SessionDep) -> Response:
    session.delete(_get_movie_or_404(session, movie_id))
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
