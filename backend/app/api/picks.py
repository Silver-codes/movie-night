import random
import threading
import uuid
from collections import OrderedDict
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, delete, select

from app.db import get_session
from app.models import (
    Movie,
    MovieRead,
    Pick,
    PickCandidate,
    PickMethod,
    PickRead,
    PickRequest,
    PickResult,
)

router = APIRouter(prefix="/picks", tags=["picks"])

SessionDep = Annotated[Session, Depends(get_session)]

_rng = random.Random()


def get_rng() -> random.Random:
    """Random source for picks; tests override it with a seeded one."""
    return _rng


@dataclass
class PendingPick:
    movie_id: int
    method: PickMethod
    # Set once confirmed, so confirming again returns the same saved pick.
    saved_id: int | None = None


class PendingPicks:
    """Picks that were shown but not confirmed yet. Only a confirmed pick is saved to the database;
    these live in memory (the most recent `limit`) and are gone after a restart: then just pick again."""

    def __init__(self, limit: int = 100) -> None:
        self._picks: OrderedDict[str, PendingPick] = OrderedDict()
        self._limit = limit
        self._lock = threading.Lock()

    def add(self, movie_id: int, method: PickMethod) -> str:
        token = uuid.uuid4().hex
        with self._lock:
            self._picks[token] = PendingPick(movie_id, method)
            while len(self._picks) > self._limit:
                self._picks.popitem(last=False)
        return token

    def get(self, token: str) -> PendingPick | None:
        with self._lock:
            return self._picks.get(token)


_pending = PendingPicks()


def get_pending_picks() -> PendingPicks:
    return _pending


PendingDep = Annotated[PendingPicks, Depends(get_pending_picks)]


def delete_unconfirmed_picks(session: Session) -> None:
    """Remove rows from before picks were saved only on confirm."""
    session.exec(delete(Pick).where(col(Pick.confirmed).is_(False)))
    session.commit()


def _hype_total(movie: Movie) -> int:
    return (movie.fuf_hype or 0) + (movie.cookie_hype or 0)


def choose(
    method: PickMethod, movies: Sequence[Movie], rng: random.Random
) -> tuple[Movie, list[tuple[Movie, float, float]]]:
    """Pick a winner; returns it with every candidate as (movie, weight, probability), in display order."""
    if not movies:
        raise ValueError("no candidates")
    # Stable order, so the same candidates always make the same wheel.
    ordered = sorted(movies, key=lambda movie: (movie.title.casefold(), movie.id or 0))
    match method:
        case PickMethod.top_rated:
            ordered.sort(key=_hype_total, reverse=True)
            best = _hype_total(ordered[0])
            tied = [movie for movie in ordered if _hype_total(movie) == best]
            candidates = [
                (movie, float(_hype_total(movie)), 1 / len(tied) if movie in tied else 0.0)
                for movie in ordered
            ]
            return rng.choice(tied), candidates
        case PickMethod.wheel_random:
            candidates = [(movie, 1.0, 1 / len(ordered)) for movie in ordered]
            return rng.choice(ordered), candidates
        case PickMethod.wheel_weighted:
            # Unrated movies still get a sliver of the wheel.
            weights = [float(_hype_total(movie) or 1) for movie in ordered]
            total = sum(weights)
            candidates = [
                (movie, weight, weight / total) for movie, weight in zip(ordered, weights, strict=True)
            ]
            return rng.choices(ordered, weights=weights)[0], candidates


@router.post("", status_code=status.HTTP_201_CREATED)
def create_pick(
    body: PickRequest,
    session: SessionDep,
    pending: PendingDep,
    rng: Annotated[random.Random, Depends(get_rng)],
) -> PickResult:
    query = (
        select(Movie)
        .where(Movie.pickable_filter())
        .options(selectinload(Movie.picks))  # type: ignore[arg-type]
    )
    if body.max_runtime is not None:
        query = query.where(col(Movie.runtime).is_not(None), col(Movie.runtime) <= body.max_runtime)
    if body.genre:
        query = query.where(Movie.has_genre(body.genre))
    movies = session.exec(query).all()
    if not movies:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No pickable movies match")

    winner, candidates = choose(body.method, movies, rng)
    assert winner.id is not None
    return PickResult(
        pick_id=pending.add(winner.id, body.method),
        method=body.method,
        winner=MovieRead.model_validate(winner),
        candidates=[
            PickCandidate(movie=MovieRead.model_validate(movie), weight=weight, probability=probability)
            for movie, weight, probability in candidates
        ],
    )


@router.post("/{pick_id}/confirm")
def confirm_pick(pick_id: str, session: SessionDep, pending: PendingDep) -> PickRead:
    """Save a pick shown by POST /picks ("we're watching this"). Confirming twice is fine."""
    entry = pending.get(pick_id)
    if entry is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This pick has expired. Pick again.")
    if entry.saved_id is not None and (saved := session.get(Pick, entry.saved_id)) is not None:
        return PickRead.model_validate(saved)
    if session.get(Movie, entry.movie_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Movie not found")
    pick = Pick(movie_id=entry.movie_id, method=entry.method, confirmed=True)
    session.add(pick)
    session.commit()
    session.refresh(pick)
    entry.saved_id = pick.id
    return PickRead.model_validate(pick)
