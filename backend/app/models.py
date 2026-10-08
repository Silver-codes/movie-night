from datetime import UTC, date, datetime, timedelta
from enum import Enum
from typing import Annotated, Final, Literal, Self

from pydantic import StringConstraints, computed_field, model_validator
from sqlalchemy import JSON, CheckConstraint, Column, ColumnElement, and_, column, exists, func, or_
from sqlmodel import Field, Relationship, SQLModel, col

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
    # The database deletes picks with their movie (ON DELETE CASCADE).
    picks: list["Pick"] = Relationship(back_populates="movie", passive_deletes="all")

    @classmethod
    def pickable_filter(cls) -> ColumnElement[bool]:
        """SQL version of `is_pickable`, for `select(Movie).where(Movie.pickable_filter())`."""
        skipped_on = col(cls.skipped_on)
        return and_(
            col(cls.status) == MovieStatus.watchlist,
            or_(skipped_on.is_(None), skipped_on != movie_night_date()),
        )

    @classmethod
    def has_genre(cls, genre: str) -> ColumnElement[bool]:
        """Case-insensitive match against one of the movie's genres."""
        genres = func.json_each(cls.genres).table_valued("value")
        return exists().select_from(genres).where(func.lower(column("value")) == genre.casefold())

    def _latest_confirmed_pick(self) -> "Pick | None":
        confirmed = [pick for pick in self.picks if pick.confirmed]
        return max(confirmed, key=lambda pick: (pick.picked_at, pick.id or 0), default=None)

    @property
    def confirmed_pick_method(self) -> PickMethod | None:
        """How the movie was picked the last time someone said "we're watching this"."""
        pick = self._latest_confirmed_pick()
        return pick.method if pick else None

    @property
    def awaiting_verdict(self) -> bool:
        """On the watchlist with a confirmed pick from a later movie night than its last watch:
        "rate it after watching". A movie moved back to the watchlist isn't awaiting until it's picked again."""
        pick = self._latest_confirmed_pick()
        if self.status != MovieStatus.watchlist or pick is None:
            return False
        # SQLite gives back naive datetimes; they're UTC.
        picked_at = pick.picked_at if pick.picked_at.tzinfo else pick.picked_at.replace(tzinfo=UTC)
        picked_on = movie_night_date(picked_at.astimezone().replace(tzinfo=None))
        return self.watched_on is None or picked_on > self.watched_on

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
    # How the latest confirmed pick was made (History badge).
    confirmed_pick_method: PickMethod | None = None
    # A confirmed pick that still needs watching and rating ("rate it after watching").
    awaiting_verdict: bool = False

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
    # Only confirmed picks are saved now; the column stays for older rows (unconfirmed ones are deleted on startup).
    confirmed: bool = True


class Pick(PickBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    picked_at: datetime = Field(default_factory=utc_now)
    movie: Movie = Relationship(back_populates="picks")


class PickRequest(SQLModel):
    """POST /picks body: the server chooses among the pickable movies matching the filters."""

    method: PickMethod
    max_runtime: int | None = Field(default=None, ge=1, description="Minutes; unknown runtimes are excluded")
    genre: str | None = None


class PickRead(PickBase):
    id: int
    picked_at: datetime


class PickCandidate(SQLModel):
    movie: MovieRead
    weight: float
    probability: float


class PickResult(SQLModel):
    # Token of the pending pick; POST /picks/{pick_id}/confirm saves it.
    pick_id: str
    method: PickMethod
    winner: MovieRead
    # In display order (wheel slices / top-rated ranking); probabilities sum to 1.
    candidates: list[PickCandidate]


# --- People ---


class PersonColor(str, Enum):
    """Curated palette keys; the frontend maps them to colors readable on the dark theme."""

    lavender = "lavender"
    rose = "rose"
    mint = "mint"
    amber = "amber"
    coral = "coral"
    sky = "sky"


ProfileName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20)]
# One emoji can be several code points (skin tones, ZWJ sequences); the frontend checks it's one grapheme.
ProfileEmoji = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=16)]


class PersonProfile(SQLModel, table=True):
    """Display name, emoji and color of a person slot (`fuf` / `cookie` stay the internal IDs)."""

    __tablename__ = "person_profile"

    id: str = Field(primary_key=True)
    name: str
    emoji: str
    color: PersonColor


# Seeded on startup for slots without a row.
DEFAULT_PROFILES: Final[dict[str, tuple[str, str, PersonColor]]] = {
    "fuf": ("Fuf", "🐻", PersonColor.lavender),
    "cookie": ("Cookie", "🍪", PersonColor.rose),
}


class PersonProfileRead(SQLModel):
    id: Person
    name: str
    emoji: str
    color: PersonColor


class PersonProfileUpdate(SQLModel):
    """PATCH /people/{person} body; only sent fields change, none of them can be null."""

    name: ProfileName | None = None
    emoji: ProfileEmoji | None = None
    color: PersonColor | None = None

    @model_validator(mode="after")
    def _no_nulls(self) -> Self:
        for field in self.model_fields_set:
            if getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


# --- History ---


class HistoryEntry(MovieRead):
    average_verdict: float | None = None


class PersonStats(SQLModel):
    average_verdict: float | None = None
    rated_count: int = 0


class Disagreement(SQLModel):
    movie: HistoryEntry
    difference: int


class HistoryStats(SQLModel):
    total_watched: int
    total_hours: float
    top_genre: str | None = None
    highest_rated: HistoryEntry | None = None
    # Average verdict stars each person gave ("Fuf vs Cookie").
    people: dict[Person, PersonStats]
    biggest_disagreement: Disagreement | None = None


class HistoryRead(SQLModel):
    movies: list[HistoryEntry]
    stats: HistoryStats
