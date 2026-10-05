from datetime import UTC, date, datetime, timedelta
from enum import Enum
from typing import Final, Literal, Self

from pydantic import computed_field, model_validator
from sqlalchemy import JSON, CheckConstraint, Column, ColumnElement, and_, or_
from sqlmodel import Field, SQLModel, col

PEOPLE: Final = ["fuf", "cookie"]
Person = Literal["fuf", "cookie"]

STAR_COLUMNS: Final = ["fuf_hype", "cookie_hype", "fuf_verdict", "cookie_verdict"]

# A movie night runs past midnight: until this local hour, it still counts as the previous day.
NIGHT_ROLLOVER_HOUR: Final = 6


def utc_now() -> datetime:
    return datetime.now(UTC)


def movie_night_date(now: datetime | None = None) -> date:
    """The date of the current movie night, in local time (the app runs on the shared device)."""
    local_now = now or datetime.now()
    return (local_now - timedelta(hours=NIGHT_ROLLOVER_HOUR)).date()


class MovieStatus(str, Enum):
    watchlist = "watchlist"
    watched = "watched"


class PickMethod(str, Enum):
    top_rated = "top_rated"
    wheel_random = "wheel_random"
    wheel_weighted = "wheel_weighted"


# --- Movie ---


def is_pickable(status: MovieStatus, skipped_on: date | None) -> bool:
    """Single rule for every pick method: only unwatched movies nobody skipped tonight."""
    return status == MovieStatus.watchlist and skipped_on != movie_night_date()


class MovieBase(SQLModel):
    tmdb_id: int
    title: str
    year: int | None = None
    overview: str | None = None
    poster_path: str | None = None
    backdrop_path: str | None = None
    runtime: int | None = Field(default=None, description="Minutes")
    genres: list[str] = Field(default_factory=list)
    tmdb_rating: float | None = None
    status: MovieStatus = MovieStatus.watchlist

    # Hype stars (before watching), used for picking.
    fuf_hype: int | None = Field(default=None, ge=1, le=5)
    cookie_hype: int | None = Field(default=None, ge=1, le=5)

    # After watching.
    watched_on: date | None = None
    fuf_verdict: int | None = Field(default=None, ge=1, le=5)
    cookie_verdict: int | None = Field(default=None, ge=1, le=5)
    fuf_note: str | None = None
    cookie_note: str | None = None


class Movie(MovieBase, table=True):
    __table_args__ = tuple(
        CheckConstraint(f"{column} IS NULL OR {column} BETWEEN 1 AND 5", name=f"ck_movie_{column}_range")
        for column in STAR_COLUMNS
    )

    id: int | None = Field(default=None, primary_key=True)
    tmdb_id: int = Field(unique=True, index=True)
    genres: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False))
    added_at: datetime = Field(default_factory=utc_now)
    # Movie night on which someone said "not tonight"; it expires on its own the next night.
    skipped_on: date | None = None

    @classmethod
    def pickable_filter(cls) -> ColumnElement[bool]:
        """SQL version of `is_pickable`, for `select(Movie).where(Movie.pickable_filter())`."""
        skipped_on = col(cls.skipped_on)
        return and_(
            col(cls.status) == MovieStatus.watchlist,
            or_(skipped_on.is_(None), skipped_on != movie_night_date()),
        )

    def apply_update(self, data: "MovieUpdate") -> None:
        changes = data.model_dump(exclude_unset=True)
        if "skipped_tonight" in changes:
            self.skipped_on = movie_night_date() if changes.pop("skipped_tonight") else None
        self.sqlmodel_update(changes)
        if self.status == MovieStatus.watched and self.watched_on is None:
            self.watched_on = movie_night_date()


class MovieCreate(MovieBase):
    pass


class MovieSave(SQLModel):
    """POST /movies body: the rest of the movie comes from TMDB."""

    tmdb_id: int
    fuf_hype: int | None = Field(default=None, ge=1, le=5)
    cookie_hype: int | None = Field(default=None, ge=1, le=5)


class MovieWatched(SQLModel):
    """POST /movies/{id}/watched body; `watched_on` defaults to tonight's movie-night date."""

    watched_on: date | None = None
    fuf_verdict: int | None = Field(default=None, ge=1, le=5)
    cookie_verdict: int | None = Field(default=None, ge=1, le=5)
    fuf_note: str | None = None
    cookie_note: str | None = None


class MovieUpdate(SQLModel):
    """PATCH body; apply it with `Movie.apply_update`."""

    skipped_tonight: bool | None = None
    status: MovieStatus | None = None
    fuf_hype: int | None = Field(default=None, ge=1, le=5)
    cookie_hype: int | None = Field(default=None, ge=1, le=5)
    watched_on: date | None = None
    fuf_verdict: int | None = Field(default=None, ge=1, le=5)
    cookie_verdict: int | None = Field(default=None, ge=1, le=5)
    fuf_note: str | None = None
    cookie_note: str | None = None

    @model_validator(mode="after")
    def _status_not_null(self) -> Self:
        # Null clears stars and notes, but a movie always has a status.
        if "status" in self.model_fields_set and self.status is None:
            raise ValueError("status cannot be null")
        return self


class MovieRead(MovieBase):
    id: int
    added_at: datetime
    skipped_on: date | None = Field(default=None, exclude=True)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def hype_total(self) -> int:
        return (self.fuf_hype or 0) + (self.cookie_hype or 0)

    @computed_field  # type: ignore[prop-decorator]
    @property
    def skipped_tonight(self) -> bool:
        return self.skipped_on == movie_night_date()

    @computed_field  # type: ignore[prop-decorator]
    @property
    def is_pickable(self) -> bool:
        return is_pickable(self.status, self.skipped_on)


# --- Pick ---


class PickBase(SQLModel):
    movie_id: int = Field(foreign_key="movie.id", ondelete="CASCADE", index=True)
    method: PickMethod
    confirmed: bool = False


class Pick(PickBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    picked_at: datetime = Field(default_factory=utc_now)


class PickCreate(PickBase):
    pass


class PickUpdate(SQLModel):
    confirmed: bool | None = None


class PickRead(PickBase):
    id: int
    picked_at: datetime
