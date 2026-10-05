from datetime import UTC, date, datetime, timedelta
from typing import Any

import pytest
import respx
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.models import Movie, MovieStatus, Pick, PickMethod, movie_night_date
from tests.factories import MakeMovie, tmdb_details


def _ids(response_json: list[dict[str, Any]]) -> list[int]:
    return [movie["id"] for movie in response_json]


# --- POST /movies ---


def test_create_saves_tmdb_details_and_hype(
    client: TestClient, tmdb_mock: respx.MockRouter
) -> None:
    tmdb_mock.get("/movie/550").respond(json=tmdb_details(550))

    response = client.post("/api/movies", json={"tmdb_id": 550, "fuf_hype": 4})

    assert response.status_code == 201
    body = response.json()
    assert body["id"] > 0
    assert body["tmdb_id"] == 550
    assert body["title"] == "Fight Club"
    assert body["year"] == 1999
    assert body["runtime"] == 139
    assert body["genres"] == ["Drama", "Thriller"]
    assert body["backdrop_path"] == "/backdrop.jpg"
    assert body["tmdb_rating"] == 8.4
    assert body["status"] == "watchlist"
    assert body["fuf_hype"] == 4
    assert body["cookie_hype"] is None
    assert body["hype_total"] == 4
    assert body["is_pickable"] is True
    assert body["skipped_tonight"] is False
    assert "skipped_on" not in body
    assert client.get(f"/api/movies/{body['id']}").json() == body


def test_create_duplicate_is_409_without_calling_tmdb(
    client: TestClient, tmdb_mock: respx.MockRouter
) -> None:
    route = tmdb_mock.get("/movie/550").respond(json=tmdb_details(550))
    client.post("/api/movies", json={"tmdb_id": 550})

    response = client.post("/api/movies", json={"tmdb_id": 550, "cookie_hype": 5})

    assert response.status_code == 409
    assert response.json() == {"detail": "Movie already saved"}
    assert route.call_count == 1
    assert len(client.get("/api/movies").json()) == 1


def test_create_unknown_tmdb_movie_is_404(
    client: TestClient, tmdb_mock: respx.MockRouter
) -> None:
    tmdb_mock.get("/movie/999").respond(404)

    response = client.post("/api/movies", json={"tmdb_id": 999})

    assert response.status_code == 404
    assert response.json() == {"detail": "Movie not found on TMDB"}
    assert client.get("/api/movies").json() == []


@pytest.mark.parametrize("body", [{"tmdb_id": 550, "fuf_hype": 6}, {"tmdb_id": 550, "cookie_hype": 0}, {}])
def test_create_rejects_invalid_body(
    client: TestClient, tmdb_mock: respx.MockRouter, body: dict[str, Any]
) -> None:
    route = tmdb_mock.get("/movie/550")

    assert client.post("/api/movies", json=body).status_code == 422
    assert not route.called


# --- GET /movies ---


def test_list_filters_by_status(client: TestClient, make_movie: MakeMovie) -> None:
    queued = make_movie()
    watched = make_movie(status=MovieStatus.watched)

    assert set(_ids(client.get("/api/movies").json())) == {queued.id, watched.id}
    assert _ids(client.get("/api/movies?status=watchlist").json()) == [queued.id]
    assert _ids(client.get("/api/movies?status=watched").json()) == [watched.id]
    assert client.get("/api/movies?status=nope").status_code == 422


def test_list_filters_by_genre_case_insensitively(
    client: TestClient, make_movie: MakeMovie
) -> None:
    drama = make_movie(genres=["Drama", "Science Fiction"])
    make_movie(genres=["Comedy"])
    make_movie(genres=[])

    assert _ids(client.get("/api/movies?genre=drama").json()) == [drama.id]
    assert _ids(client.get("/api/movies?genre=SCIENCE FICTION").json()) == [drama.id]
    # Exact genre names only, no substring matches.
    assert client.get("/api/movies?genre=dram").json() == []


def test_list_unrated_by_uses_hype_on_watchlist_and_verdict_when_watched(
    client: TestClient, make_movie: MakeMovie
) -> None:
    needs_fuf_hype = make_movie(cookie_hype=3)
    make_movie(fuf_hype=5)
    needs_fuf_verdict = make_movie(status=MovieStatus.watched, fuf_hype=4, cookie_verdict=2)
    make_movie(status=MovieStatus.watched, fuf_verdict=3)

    fuf = set(_ids(client.get("/api/movies?unrated_by=fuf").json()))
    watched_fuf = _ids(client.get("/api/movies?unrated_by=fuf&status=watched").json())

    assert fuf == {needs_fuf_hype.id, needs_fuf_verdict.id}
    assert watched_fuf == [needs_fuf_verdict.id]
    assert client.get("/api/movies?unrated_by=bob").status_code == 422


def test_list_combines_filters(client: TestClient, make_movie: MakeMovie) -> None:
    match = make_movie(genres=["Horror"])
    make_movie(genres=["Horror"], cookie_hype=2)
    make_movie(genres=["Horror"], status=MovieStatus.watched)
    make_movie(genres=["Drama"])

    response = client.get("/api/movies?status=watchlist&genre=horror&unrated_by=cookie")

    assert _ids(response.json()) == [match.id]


@pytest.fixture
def sortable(make_movie: MakeMovie) -> dict[str, int]:
    base = datetime(2026, 1, 1, tzinfo=UTC)
    movies = {
        "oldest": make_movie(
            title="banana", runtime=120, tmdb_rating=6.0, fuf_hype=5, cookie_hype=5,
            added_at=base,
        ),
        "middle": make_movie(
            title="Apple", runtime=None, tmdb_rating=None, fuf_hype=1,
            added_at=base + timedelta(days=1),
        ),
        "newest": make_movie(
            title="cherry", runtime=90, tmdb_rating=7.5, fuf_hype=None, cookie_hype=None,
            added_at=base + timedelta(days=2),
        ),
    }
    return {name: movie.id for name, movie in movies.items() if movie.id is not None}


@pytest.mark.parametrize(
    ("sort", "expected"),
    [
        (None, ["newest", "middle", "oldest"]),
        ("added", ["newest", "middle", "oldest"]),
        ("title", ["middle", "oldest", "newest"]),  # Apple, banana, cherry
        ("runtime", ["newest", "oldest", "middle"]),  # 90, 120, null last
        ("hype_total", ["oldest", "middle", "newest"]),  # 10, 1, 0
        ("tmdb_rating", ["newest", "oldest", "middle"]),  # 7.5, 6.0, null last
    ],
)
def test_list_sorts(
    client: TestClient, sortable: dict[str, int], sort: str | None, expected: list[str]
) -> None:
    params = {"sort": sort} if sort else {}

    response = client.get("/api/movies", params=params)

    assert _ids(response.json()) == [sortable[name] for name in expected]


def test_list_rejects_unknown_sort(client: TestClient) -> None:
    assert client.get("/api/movies?sort=popularity").status_code == 422


# --- GET /movies/{id} ---


def test_get_movie(client: TestClient, make_movie: MakeMovie) -> None:
    movie = make_movie(title="Heat", fuf_hype=3, cookie_hype=4)

    body = client.get(f"/api/movies/{movie.id}").json()

    assert body["title"] == "Heat"
    assert body["hype_total"] == 7


def test_get_missing_movie_is_404(client: TestClient) -> None:
    response = client.get("/api/movies/123")

    assert response.status_code == 404
    assert response.json() == {"detail": "Movie not found"}


# --- PATCH /movies/{id} ---


def test_patch_sets_a_star_and_leaves_the_rest(client: TestClient, make_movie: MakeMovie) -> None:
    movie = make_movie(fuf_hype=2, cookie_hype=3, fuf_note="maybe")

    body = client.patch(f"/api/movies/{movie.id}", json={"fuf_hype": 5}).json()

    assert body["fuf_hype"] == 5
    assert body["cookie_hype"] == 3
    assert body["fuf_note"] == "maybe"
    assert body["hype_total"] == 8


def test_patch_null_clears_a_field(client: TestClient, make_movie: MakeMovie) -> None:
    movie = make_movie(fuf_hype=2, cookie_hype=3, cookie_note="yes!")

    body = client.patch(
        f"/api/movies/{movie.id}", json={"cookie_hype": None, "cookie_note": None}
    ).json()

    assert body["cookie_hype"] is None
    assert body["cookie_note"] is None
    assert body["fuf_hype"] == 2
    assert client.get(f"/api/movies/{movie.id}").json()["cookie_hype"] is None


def test_patch_one_person_can_edit_the_others_stars(
    client: TestClient, make_movie: MakeMovie
) -> None:
    movie = make_movie(status=MovieStatus.watched, fuf_verdict=1)

    body = client.patch(
        f"/api/movies/{movie.id}", json={"fuf_verdict": 4, "cookie_verdict": 5}
    ).json()

    assert (body["fuf_verdict"], body["cookie_verdict"]) == (4, 5)


@pytest.mark.parametrize(
    "body",
    [
        {"fuf_hype": 0},
        {"cookie_verdict": 6},
        {"fuf_hype": 2.5},
        {"status": None},
        {"status": "lost"},
    ],
)
def test_patch_rejects_invalid_values(
    client: TestClient, make_movie: MakeMovie, body: dict[str, Any]
) -> None:
    movie = make_movie(fuf_hype=3)

    assert client.patch(f"/api/movies/{movie.id}", json=body).status_code == 422
    assert client.get(f"/api/movies/{movie.id}").json()["fuf_hype"] == 3


def test_patch_skip_tonight_toggles_pickable(client: TestClient, make_movie: MakeMovie) -> None:
    movie = make_movie()

    skipped = client.patch(f"/api/movies/{movie.id}", json={"skipped_tonight": True}).json()
    unskipped = client.patch(f"/api/movies/{movie.id}", json={"skipped_tonight": False}).json()

    assert (skipped["skipped_tonight"], skipped["is_pickable"]) == (True, False)
    assert (unskipped["skipped_tonight"], unskipped["is_pickable"]) == (False, True)


def test_skip_from_a_previous_night_has_expired(client: TestClient, make_movie: MakeMovie) -> None:
    movie = make_movie(skipped_on=movie_night_date() - timedelta(days=1))

    body = client.get(f"/api/movies/{movie.id}").json()

    assert (body["skipped_tonight"], body["is_pickable"]) == (False, True)


def test_patch_status_watched_defaults_watched_on(
    client: TestClient, make_movie: MakeMovie
) -> None:
    movie = make_movie()

    body = client.patch(f"/api/movies/{movie.id}", json={"status": "watched"}).json()

    assert body["status"] == "watched"
    assert body["watched_on"] == movie_night_date().isoformat()
    assert body["is_pickable"] is False


def test_patch_status_back_to_watchlist(client: TestClient, make_movie: MakeMovie) -> None:
    movie = make_movie(status=MovieStatus.watched, watched_on=date(2026, 9, 1))

    body = client.patch(f"/api/movies/{movie.id}", json={"status": "watchlist"}).json()

    assert body["status"] == "watchlist"
    assert body["is_pickable"] is True


def test_patch_missing_movie_is_404(client: TestClient) -> None:
    assert client.patch("/api/movies/123", json={"fuf_hype": 3}).status_code == 404


# --- POST /movies/{id}/watched ---


def test_watched_defaults_to_tonight(client: TestClient, make_movie: MakeMovie) -> None:
    movie = make_movie(fuf_hype=4)

    response = client.post(f"/api/movies/{movie.id}/watched", json={})

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "watched"
    assert body["watched_on"] == movie_night_date().isoformat()
    assert body["fuf_hype"] == 4
    assert body["is_pickable"] is False


def test_watched_with_date_verdicts_and_notes(client: TestClient, make_movie: MakeMovie) -> None:
    movie = make_movie()

    body = client.post(
        f"/api/movies/{movie.id}/watched",
        json={
            "watched_on": "2026-09-30",
            "fuf_verdict": 5,
            "cookie_verdict": 3,
            "fuf_note": "loved it",
            "cookie_note": "too long",
        },
    ).json()

    assert body["watched_on"] == "2026-09-30"
    assert (body["fuf_verdict"], body["cookie_verdict"]) == (5, 3)
    assert (body["fuf_note"], body["cookie_note"]) == ("loved it", "too long")


def test_watched_keeps_verdicts_that_were_not_sent(
    client: TestClient, make_movie: MakeMovie
) -> None:
    movie = make_movie(status=MovieStatus.watched, fuf_verdict=4, fuf_note="good")

    body = client.post(f"/api/movies/{movie.id}/watched", json={"cookie_verdict": 2}).json()

    assert (body["fuf_verdict"], body["fuf_note"]) == (4, "good")
    assert body["cookie_verdict"] == 2


def test_watched_rejects_invalid_verdict(client: TestClient, make_movie: MakeMovie) -> None:
    movie = make_movie()

    response = client.post(f"/api/movies/{movie.id}/watched", json={"fuf_verdict": 9})

    assert response.status_code == 422
    assert client.get(f"/api/movies/{movie.id}").json()["status"] == "watchlist"


def test_watched_missing_movie_is_404(client: TestClient) -> None:
    assert client.post("/api/movies/123/watched", json={}).status_code == 404


# --- DELETE /movies/{id} ---


def test_delete_movie_and_its_picks(
    client: TestClient, make_movie: MakeMovie, session: Session
) -> None:
    movie = make_movie()
    other = make_movie()
    assert movie.id is not None and other.id is not None
    session.add(Pick(movie_id=movie.id, method=PickMethod.top_rated))
    session.add(Pick(movie_id=other.id, method=PickMethod.wheel_random))
    session.commit()

    response = client.delete(f"/api/movies/{movie.id}")

    assert response.status_code == 204
    assert response.content == b""
    assert client.get(f"/api/movies/{movie.id}").status_code == 404
    assert [pick.movie_id for pick in session.exec(select(Pick)).all()] == [other.id]
    assert [m.id for m in session.exec(select(Movie)).all()] == [other.id]


def test_delete_missing_movie_is_404(client: TestClient) -> None:
    assert client.delete("/api/movies/123").status_code == 404
