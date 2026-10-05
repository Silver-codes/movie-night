import random
from collections.abc import Sequence
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, col, select

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
    rng: Annotated[random.Random, Depends(get_rng)],
) -> PickResult:
    query = select(Movie).where(Movie.pickable_filter())
    if body.max_runtime is not None:
        query = query.where(col(Movie.runtime).is_not(None), col(Movie.runtime) <= body.max_runtime)
    if body.genre:
        query = query.where(Movie.has_genre(body.genre))
    movies = session.exec(query).all()
    if not movies:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No pickable movies match")

    winner, candidates = choose(body.method, movies, rng)
    assert winner.id is not None
    pick = Pick(movie_id=winner.id, method=body.method)
    session.add(pick)
    session.commit()
    session.refresh(pick)
    assert pick.id is not None
    return PickResult(
        pick_id=pick.id,
        method=pick.method,
        winner=MovieRead.model_validate(winner),
        candidates=[
            PickCandidate(movie=MovieRead.model_validate(movie), weight=weight, probability=probability)
            for movie, weight, probability in candidates
        ],
    )


@router.post("/{pick_id}/confirm")
def confirm_pick(pick_id: int, session: SessionDep) -> PickRead:
    pick = session.get(Pick, pick_id)
    if pick is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pick not found")
    pick.confirmed = True
    session.add(pick)
    session.commit()
    session.refresh(pick)
    return PickRead.model_validate(pick)
