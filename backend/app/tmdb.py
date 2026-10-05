"""TMDB API client. The only place the backend talks to TMDB; the token never leaves this module."""

import logging
import time
from typing import Any, Final

import httpx
from fastapi import Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)

TMDB_API_URL: Final = "https://api.themoviedb.org/3"
TMDB_IMAGE_URL: Final = "https://image.tmdb.org/t/p"
POSTER_SIZE: Final = "w342"
REQUEST_TIMEOUT: Final = 10.0
SEARCH_CACHE_TTL: Final = 300.0
SEARCH_CACHE_MAX_ENTRIES: Final = 200


class TMDBError(Exception):
    """A TMDB failure, already translated to the HTTP status our API should answer with."""

    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


# --- Schemas ---


class TMDBSearchResult(BaseModel):
    tmdb_id: int
    title: str
    year: int | None
    overview: str | None
    poster_url: str | None
    tmdb_rating: float | None


class TMDBMovieDetails(BaseModel):
    """Field names match `MovieBase`, so `MovieCreate.model_validate(details.model_dump())` works."""

    tmdb_id: int
    title: str
    year: int | None
    overview: str | None
    poster_path: str | None
    backdrop_path: str | None
    runtime: int | None
    genres: list[str]
    tmdb_rating: float | None


def poster_url(path: str | None) -> str | None:
    return f"{TMDB_IMAGE_URL}/{POSTER_SIZE}{path}" if path else None


def _year(release_date: str | None) -> int | None:
    if not release_date or len(release_date) < 4 or not release_date[:4].isdigit():
        return None
    return int(release_date[:4])


def _rating(data: dict[str, Any]) -> float | None:
    # TMDB reports 0.0 for movies nobody voted on yet; that isn't a real rating.
    if not data.get("vote_count"):
        return None
    vote_average = data.get("vote_average")
    return float(vote_average) if vote_average is not None else None


def _search_result(data: dict[str, Any]) -> TMDBSearchResult:
    return TMDBSearchResult(
        tmdb_id=data["id"],
        title=data.get("title") or data.get("original_title") or "Untitled",
        year=_year(data.get("release_date")),
        overview=data.get("overview") or None,
        poster_url=poster_url(data.get("poster_path")),
        tmdb_rating=_rating(data),
    )


def _movie_details(data: dict[str, Any]) -> TMDBMovieDetails:
    return TMDBMovieDetails(
        tmdb_id=data["id"],
        title=data.get("title") or data.get("original_title") or "Untitled",
        year=_year(data.get("release_date")),
        overview=data.get("overview") or None,
        poster_path=data.get("poster_path"),
        backdrop_path=data.get("backdrop_path"),
        runtime=data.get("runtime") or None,
        genres=[genre["name"] for genre in data.get("genres", []) if genre.get("name")],
        tmdb_rating=_rating(data),
    )


# --- Cache ---


class TTLCache[T]:
    """Tiny in-memory cache with per-entry expiry. Fine for one process on one device."""

    def __init__(self, ttl: float, max_entries: int) -> None:
        self._ttl = ttl
        self._max_entries = max_entries
        self._entries: dict[str, tuple[float, T]] = {}

    def get(self, key: str) -> T | None:
        entry = self._entries.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if expires_at <= time.monotonic():
            del self._entries[key]
            return None
        return value

    def set(self, key: str, value: T) -> None:
        now = time.monotonic()
        self._entries = {k: e for k, e in self._entries.items() if e[0] > now}
        while len(self._entries) >= self._max_entries:
            # Dicts keep insertion order, so the first key is the oldest entry.
            del self._entries[next(iter(self._entries))]
        self._entries[key] = (now + self._ttl, value)


def _cache_key(query: str) -> str:
    return " ".join(query.split()).casefold()


# --- Client ---


class TMDBClient:
    def __init__(self, token: str) -> None:
        self._configured = bool(token)
        self._http = httpx.AsyncClient(
            base_url=TMDB_API_URL,
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
            timeout=REQUEST_TIMEOUT,
        )
        self._search_cache: TTLCache[list[TMDBSearchResult]] = TTLCache(
            SEARCH_CACHE_TTL, SEARCH_CACHE_MAX_ENTRIES
        )

    async def aclose(self) -> None:
        await self._http.aclose()

    async def _get(self, path: str, params: dict[str, str | int] | None = None) -> dict[str, Any]:
        if not self._configured:
            raise TMDBError(503, "TMDB token is not configured")
        try:
            response = await self._http.get(path, params=params)
        except httpx.TimeoutException as exc:
            raise TMDBError(504, "TMDB timed out") from exc
        except httpx.RequestError as exc:
            logger.warning("TMDB request to %s failed: %s", path, type(exc).__name__)
            raise TMDBError(502, "Could not reach TMDB") from exc

        if response.status_code == 401:
            raise TMDBError(502, "TMDB rejected the token")
        if response.status_code == 404:
            raise TMDBError(404, "Movie not found on TMDB")
        if response.status_code == 429:
            raise TMDBError(503, "TMDB rate limit, try again shortly")
        if response.is_error:
            logger.warning("TMDB %s answered %s", path, response.status_code)
            raise TMDBError(502, "TMDB error")
        try:
            data = response.json()
        except ValueError as exc:
            raise TMDBError(502, "TMDB error") from exc
        if not isinstance(data, dict):
            raise TMDBError(502, "TMDB error")
        return data

    async def search_movies(self, query: str) -> list[TMDBSearchResult]:
        key = _cache_key(query)
        cached = self._search_cache.get(key)
        if cached is not None:
            return cached
        data = await self._get(
            "/search/movie", params={"query": key, "include_adult": "false", "page": 1}
        )
        results = [_search_result(item) for item in data.get("results", [])]
        self._search_cache.set(key, results)
        return results

    async def get_movie_details(self, tmdb_id: int) -> TMDBMovieDetails:
        """Full details for saving a movie (runtime, genres, backdrop)."""
        return _movie_details(await self._get(f"/movie/{tmdb_id}"))


def get_tmdb(request: Request) -> TMDBClient:
    """FastAPI dependency; the client is created once in `main.lifespan`."""
    client: TMDBClient = request.app.state.tmdb
    return client
