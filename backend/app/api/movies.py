import threading
from collections import OrderedDict
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import ColumnElement, and_, func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
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
    Pick,
    PickMethod,
    movie_night_date,
)
from app.tmdb import TMDBClient, get_tmdb

router = APIRouter(prefix="/movies", tags=["movies"])

SessionDep = Annotated[Session, Depends(get_session)]


@dataclass(frozen=True)
class CancelledPick:
    method: PickMethod
    picked_at: datetime


class CancelledPicks:
    """The pick each movie lost to its last "didn't watch it" (the most recent `limit`), so Undo can put it back.
    In memory like pending picks: gone after a restart, and then it's too late to undo."""

    def __init__(self, limit: int = 100) -> None:
        self._picks: OrderedDict[int, CancelledPick] = OrderedDict()
        self._limit = limit
        self._lock = threading.Lock()

    def put(self, movie_id: int, pick: CancelledPick) -> None:
        with self._lock:
            self._picks.pop(movie_id, None)
            self._picks[movie_id] = pick
            while len(self._picks) > self._limit:
                self._picks.popitem(last=False)

    def pop(self, movie_id: int) -> CancelledPick | None:
        with self._lock:
            return self._picks.pop(movie_id, None)


_cancelled = CancelledPicks()


def get_cancelled_picks() -> CancelledPicks:
    return _cancelled


CancelledDep = Annotated[CancelledPicks, Depends(get_cancelled_picks)]


class MovieSort(str, Enum):
    added = "added"
    title = "title"
    runtime = "runtime"
    hype_total = "hype_total"
    tmdb_rating = "tmdb_rating"


def _get_movie_or_404(session: Session, movie_id: int) -> Movie:
    # Picks loaded up front: MovieRead reads them (confirmed_pick_method, awaiting_verdict).
    movie = session.get(Movie, movie_id, options=[selectinload(Movie.picks)])  # type: ignore[arg-type]
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
    query = select(Movie).options(selectinload(Movie.picks))  # type: ignore[arg-type]
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


@router.delete("/{movie_id}/pick")
def cancel_pick(movie_id: int, session: SessionDep, cancelled: CancelledDep) -> MovieRead:
    """Undo "we're watching this!" for a movie they didn't watch after all: its latest confirmed pick goes, so the
    "rate it after watching" reminder does too. The movie stays on the watchlist with its hype, pickable as before.
    Only while it's awaiting a verdict: a watched movie's pick is part of its history. POST .../pick/restore undoes it."""
    movie = _get_movie_or_404(session, movie_id)
    pick = movie.latest_confirmed_pick()
    if pick is None or not movie.awaiting_verdict:
        raise HTTPException(status.HTTP_409_CONFLICT, "This movie isn't waiting to be watched")
    cancelled.put(movie_id, CancelledPick(pick.method, pick.picked_at))
    session.delete(pick)
    session.commit()
    session.refresh(movie)
    return MovieRead.model_validate(movie)


@router.post("/{movie_id}/pick/restore")
def restore_pick(movie_id: int, session: SessionDep, cancelled: CancelledDep) -> MovieRead:
    """Undo a DELETE .../pick: the pick it removed comes back as it was (same method and time), so the movie is
    awaiting its verdict again. Only the server's own record of that pick is restored; the client names no pick."""
    movie = _get_movie_or_404(session, movie_id)
    pick = cancelled.pop(movie_id)
    if pick is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Too late to undo that. Pick it again.")
    # Picked again or watched since: that's the newer decision.
    if movie.status != MovieStatus.watchlist or movie.awaiting_verdict:
        raise HTTPException(status.HTTP_409_CONFLICT, "This movie was picked or watched since")
    session.add(Pick(movie_id=movie_id, method=pick.method, picked_at=pick.picked_at, confirmed=True))
    session.commit()
    session.refresh(movie)
    return MovieRead.model_validate(movie)


@router.delete("/{movie_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_movie(movie_id: int, session: SessionDep) -> Response:
    session.delete(_get_movie_or_404(session, movie_id))
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
