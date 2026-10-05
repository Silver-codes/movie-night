"""Fake TMDB payloads (shaped like the real API responses) and shared test types."""

from collections.abc import Callable
from typing import Any

from app.models import Movie

MakeMovie = Callable[..., Movie]


def tmdb_search_item(tmdb_id: int = 550, **overrides: Any) -> dict[str, Any]:
    return {
        "id": tmdb_id,
        "title": "Fight Club",
        "original_title": "Fight Club",
        "release_date": "1999-10-15",
        "overview": "An insomniac office worker...",
        "poster_path": "/poster.jpg",
        "vote_average": 8.4,
        "vote_count": 30000,
        **overrides,
    }


def tmdb_details(tmdb_id: int = 550, **overrides: Any) -> dict[str, Any]:
    return {
        **tmdb_search_item(tmdb_id),
        "backdrop_path": "/backdrop.jpg",
        "runtime": 139,
        "genres": [{"id": 18, "name": "Drama"}, {"id": 53, "name": "Thriller"}],
        **overrides,
    }
