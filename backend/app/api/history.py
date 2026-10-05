from collections import Counter
from statistics import fmean
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, select

from app.db import get_session
from app.models import (
    PEOPLE,
    Disagreement,
    HistoryEntry,
    HistoryRead,
    HistoryStats,
    Movie,
    MovieStatus,
    PersonStats,
)

router = APIRouter(prefix="/history", tags=["history"])

SessionDep = Annotated[Session, Depends(get_session)]


def _entry(movie: Movie) -> HistoryEntry:
    verdicts = [v for v in (movie.fuf_verdict, movie.cookie_verdict) if v is not None]
    entry = HistoryEntry.model_validate(movie)
    entry.average_verdict = fmean(verdicts) if verdicts else None
    return entry


def _stats(entries: list[HistoryEntry]) -> HistoryStats:
    # `entries` is newest first, so max() keeps the most recent movie on ties.
    genres = Counter(genre for entry in entries for genre in entry.genres)
    top_genre = min(genres, key=lambda genre: (-genres[genre], genre)) if genres else None

    rated = [entry for entry in entries if entry.average_verdict is not None]
    highest_rated = max(rated, key=lambda entry: entry.average_verdict or 0) if rated else None

    people: dict[str, PersonStats] = {}
    for person in PEOPLE:
        given = [v for entry in entries if (v := getattr(entry, f"{person}_verdict")) is not None]
        people[person] = PersonStats(average_verdict=fmean(given) if given else None, rated_count=len(given))

    disagreements = [
        Disagreement(movie=entry, difference=abs(entry.fuf_verdict - entry.cookie_verdict))
        for entry in entries
        if entry.fuf_verdict is not None and entry.cookie_verdict is not None
    ]
    biggest = max(disagreements, key=lambda d: d.difference, default=None)

    return HistoryStats(
        total_watched=len(entries),
        total_hours=round(sum(entry.runtime or 0 for entry in entries) / 60, 1),
        top_genre=top_genre,
        highest_rated=highest_rated,
        people=people,  # type: ignore[arg-type]
        biggest_disagreement=biggest if biggest and biggest.difference > 0 else None,
    )


@router.get("")
def get_history(session: SessionDep) -> HistoryRead:
    movies = session.exec(
        select(Movie)
        .where(Movie.status == MovieStatus.watched)
        .options(selectinload(Movie.picks))  # type: ignore[arg-type]
        .order_by(col(Movie.watched_on).desc().nulls_last(), col(Movie.id).desc())
    ).all()
    entries = [_entry(movie) for movie in movies]
    return HistoryRead(movies=entries, stats=_stats(entries))
