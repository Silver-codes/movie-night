from datetime import date
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import MovieStatus, Pick, PickMethod
from tests.factories import MakeMovie


def _history(client: TestClient) -> dict[str, Any]:
    response = client.get("/api/history")
    assert response.status_code == 200
    body: dict[str, Any] = response.json()
    return body


def _watched(make_movie: MakeMovie, day: int, **overrides: Any) -> int:
    movie = make_movie(status=MovieStatus.watched, watched_on=date(2026, 9, day), **overrides)
    assert movie.id is not None
    return movie.id


def test_empty_history(client: TestClient, make_movie: MakeMovie) -> None:
    make_movie(fuf_hype=5)  # still on the watchlist

    assert _history(client) == {
        "movies": [],
        "stats": {
            "total_watched": 0,
            "total_hours": 0,
            "top_genre": None,
            "highest_rated": None,
            "people": {
                "fuf": {"average_verdict": None, "rated_count": 0},
                "cookie": {"average_verdict": None, "rated_count": 0},
            },
            "biggest_disagreement": None,
        },
    }


def test_only_watched_movies_newest_first(client: TestClient, make_movie: MakeMovie) -> None:
    older = _watched(make_movie, 1)
    newer = _watched(make_movie, 20)
    make_movie(title="Not watched")

    movies = _history(client)["movies"]

    assert [m["id"] for m in movies] == [newer, older]


def test_entry_has_verdicts_notes_average_and_pick_method(
    client: TestClient, make_movie: MakeMovie, session: Session
) -> None:
    movie_id = _watched(
        make_movie, 5, fuf_verdict=4, cookie_verdict=5, fuf_note="Loved it", cookie_note="Cried"
    )
    session.add(Pick(movie_id=movie_id, method=PickMethod.wheel_weighted, confirmed=True))
    session.commit()

    (entry,) = _history(client)["movies"]

    assert entry["fuf_verdict"] == 4
    assert entry["cookie_verdict"] == 5
    assert entry["fuf_note"] == "Loved it"
    assert entry["cookie_note"] == "Cried"
    assert entry["average_verdict"] == 4.5
    assert entry["confirmed_pick_method"] == "wheel_weighted"
    assert entry["watched_on"] == "2026-09-05"


def test_average_uses_only_given_verdicts(client: TestClient, make_movie: MakeMovie) -> None:
    _watched(make_movie, 1, cookie_verdict=3)
    _watched(make_movie, 2)

    newest, oldest = _history(client)["movies"]

    assert oldest["average_verdict"] == 3
    assert newest["average_verdict"] is None
    assert newest["confirmed_pick_method"] is None


def test_stats(client: TestClient, make_movie: MakeMovie) -> None:
    _watched(make_movie, 1, title="Old", runtime=90, genres=["Drama"], fuf_verdict=5, cookie_verdict=4)
    _watched(make_movie, 2, title="Split", runtime=120, genres=["Horror", "Drama"], fuf_verdict=1, cookie_verdict=5)
    _watched(make_movie, 3, title="Fav", runtime=None, genres=["Comedy"], fuf_verdict=5, cookie_verdict=5)
    _watched(make_movie, 4, title="Unrated", runtime=100, genres=["Horror"], fuf_verdict=4)

    stats = _history(client)["stats"]

    assert stats["total_watched"] == 4
    assert stats["total_hours"] == 5.2  # 310 minutes; unknown runtime counts as 0
    assert stats["top_genre"] == "Drama"  # Drama 2, Horror 2 -> alphabetical
    assert stats["highest_rated"]["title"] == "Fav"
    assert stats["highest_rated"]["average_verdict"] == 5
    assert stats["people"] == {
        "fuf": {"average_verdict": pytest.approx(3.75), "rated_count": 4},
        "cookie": {"average_verdict": pytest.approx(14 / 3), "rated_count": 3},
    }
    assert stats["biggest_disagreement"]["movie"]["title"] == "Split"
    assert stats["biggest_disagreement"]["difference"] == 4


def test_ties_prefer_the_most_recent(client: TestClient, make_movie: MakeMovie) -> None:
    _watched(make_movie, 1, title="Older", fuf_verdict=5, cookie_verdict=3)
    _watched(make_movie, 2, title="Newer", fuf_verdict=3, cookie_verdict=5)

    stats = _history(client)["stats"]

    assert stats["highest_rated"]["title"] == "Newer"
    assert stats["biggest_disagreement"]["movie"]["title"] == "Newer"


def test_no_disagreement_when_they_always_agree(client: TestClient, make_movie: MakeMovie) -> None:
    _watched(make_movie, 1, fuf_verdict=4, cookie_verdict=4)
    _watched(make_movie, 2, fuf_verdict=2)

    assert _history(client)["stats"]["biggest_disagreement"] is None
