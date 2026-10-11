from typing import Any

import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from tests.factories import MakeMovie, tmdb_details, tmdb_search_item


def test_search_maps_tmdb_results(client: TestClient, tmdb_mock: respx.MockRouter) -> None:
    tmdb_mock.get("/search/movie").respond(
        json={
            "results": [
                tmdb_search_item(550),
                tmdb_search_item(
                    551,
                    title="",
                    original_title="Original",
                    release_date="",
                    poster_path=None,
                    overview="",
                    vote_average=0.0,
                    vote_count=0,
                ),
            ]
        }
    )

    response = client.get("/api/search", params={"q": "fight"})

    assert response.status_code == 200
    assert response.json() == [
        {
            "tmdb_id": 550,
            "title": "Fight Club",
            "year": 1999,
            "overview": "An insomniac office worker...",
            "poster_url": "https://image.tmdb.org/t/p/w342/poster.jpg",
            "tmdb_rating": 8.4,
            "already_saved": False,
            "movie_id": None,
        },
        {
            "tmdb_id": 551,
            "title": "Original",
            "year": None,
            "overview": None,
            "poster_url": None,
            "tmdb_rating": None,
            "already_saved": False,
            "movie_id": None,
        },
    ]


def test_search_sends_normalized_query(client: TestClient, tmdb_mock: respx.MockRouter) -> None:
    route = tmdb_mock.get("/search/movie").respond(json={"results": []})

    client.get("/api/search", params={"q": "  Fight   CLUB "})

    params = route.calls.last.request.url.params
    assert params["query"] == "fight club"
    assert params["include_adult"] == "false"
    assert route.calls.last.request.headers["Authorization"] == "Bearer test-token"


def test_search_flags_saved_movies(
    client: TestClient, tmdb_mock: respx.MockRouter, make_movie: MakeMovie
) -> None:
    movie = make_movie(tmdb_id=550)
    tmdb_mock.get("/search/movie").respond(
        json={"results": [tmdb_search_item(550), tmdb_search_item(551)]}
    )

    results = client.get("/api/search?q=x").json()

    assert {r["tmdb_id"]: r["already_saved"] for r in results} == {550: True, 551: False}
    assert {r["tmdb_id"]: r["movie_id"] for r in results} == {550: movie.id, 551: None}


def test_search_caches_tmdb_but_not_already_saved(
    client: TestClient, tmdb_mock: respx.MockRouter, make_movie: MakeMovie
) -> None:
    route = tmdb_mock.get("/search/movie").respond(json={"results": [tmdb_search_item(550)]})

    first = client.get("/api/search?q=fight").json()
    make_movie(tmdb_id=550)
    second = client.get("/api/search?q=FIGHT").json()

    assert route.call_count == 1
    assert first[0]["already_saved"] is False
    assert second[0]["already_saved"] is True


def test_blank_query_returns_empty_without_calling_tmdb(
    client: TestClient, tmdb_mock: respx.MockRouter
) -> None:
    route = tmdb_mock.get("/search/movie")

    response = client.get("/api/search", params={"q": "   "})

    assert response.status_code == 200
    assert response.json() == []
    assert not route.called


def test_missing_query_is_rejected(client: TestClient) -> None:
    assert client.get("/api/search").status_code == 422


@pytest.mark.parametrize(
    ("tmdb_status", "expected_status"),
    [(401, 502), (404, 404), (429, 503), (500, 502)],
)
def test_tmdb_errors_are_translated(
    client: TestClient, tmdb_mock: respx.MockRouter, tmdb_status: int, expected_status: int
) -> None:
    tmdb_mock.get("/search/movie").respond(tmdb_status)

    response = client.get("/api/search?q=fight")

    assert response.status_code == expected_status
    assert "detail" in response.json()


def test_tmdb_timeout(client: TestClient, tmdb_mock: respx.MockRouter) -> None:
    tmdb_mock.get("/search/movie").mock(side_effect=httpx.ReadTimeout("slow"))

    response = client.get("/api/search?q=fight")

    assert response.status_code == 504
    assert response.json() == {"detail": "TMDB timed out"}


def test_tmdb_unreachable(client: TestClient, tmdb_mock: respx.MockRouter) -> None:
    tmdb_mock.get("/search/movie").mock(side_effect=httpx.ConnectError("down"))

    assert client.get("/api/search?q=fight").status_code == 502


@pytest.mark.parametrize("tmdb_token", [""])
def test_missing_token(client: TestClient, tmdb_mock: respx.MockRouter) -> None:
    route = tmdb_mock.get("/search/movie")

    response = client.get("/api/search?q=fight")

    assert response.status_code == 503
    assert response.json() == {"detail": "TMDB token is not configured"}
    assert not route.called


# --- GET /api/tmdb/movies/{tmdb_id} ---


def _info_payload(**overrides: Any) -> dict[str, Any]:
    return tmdb_details(
        672,
        title="Harry Potter and the Chamber of Secrets",
        tagline="  Hogwarts is back in session.  ",
        belongs_to_collection={"id": 1241, "name": "Harry Potter Collection"},
        credits={
            "cast": [
                {"name": f"Actor {n}", "order": n} for n in (6, 2, 0, 1, 5, 3, 4)
            ],
            "crew": [
                {"name": "Chris Columbus", "job": "Director"},
                {"name": "John Williams", "job": "Original Music Composer"},
            ],
        },
        videos={
            "results": [
                {"site": "Vimeo", "type": "Trailer", "key": "vimeo"},
                {"site": "YouTube", "type": "Teaser", "key": "teaser"},
                {"site": "YouTube", "type": "Trailer", "key": "fan", "official": False},
                {"site": "YouTube", "type": "Trailer", "key": "official", "official": True},
            ]
        },
        release_dates={
            "results": [
                {"iso_3166_1": "US", "release_dates": [{"certification": "PG"}]},
                {"iso_3166_1": "CZ", "release_dates": [{"certification": ""}, {"certification": "12"}]},
            ]
        },
        **overrides,
    )


def _collection_payload() -> dict[str, Any]:
    return {
        "id": 1241,
        "name": "Harry Potter Collection",
        "parts": [
            {"id": 674, "release_date": "2005-11-16"},
            {"id": 672, "release_date": "2002-11-13"},
            {"id": 671, "release_date": "2001-11-16"},
            {"id": 999, "release_date": ""},
        ],
    }


def test_movie_info_maps_details_and_extras(client: TestClient, tmdb_mock: respx.MockRouter) -> None:
    details = tmdb_mock.get("/movie/672").respond(json=_info_payload())
    tmdb_mock.get("/collection/1241").respond(json=_collection_payload())

    response = client.get("/api/tmdb/movies/672")

    assert response.status_code == 200
    body = response.json()
    assert details.calls.last.request.url.params["append_to_response"] == "credits,videos,release_dates"
    assert body["title"] == "Harry Potter and the Chamber of Secrets"
    assert body["runtime"] == 139
    assert body["genres"] == ["Drama", "Thriller"]
    assert body["tagline"] == "Hogwarts is back in session."
    assert body["directors"] == ["Chris Columbus"]
    assert body["cast"] == ["Actor 0", "Actor 1", "Actor 2", "Actor 3", "Actor 4"]
    assert body["trailer_url"] == "https://www.youtube.com/watch?v=official"
    # Czech rating first; its empty entry is skipped.
    assert body["certification"] == "12"
    # Undated parts don't count: 671, 672, 674.
    assert body["collection"] == {"name": "Harry Potter Collection", "position": 2, "total": 3}


def test_movie_info_falls_back_to_us_rating_and_handles_missing_extras(
    client: TestClient, tmdb_mock: respx.MockRouter
) -> None:
    tmdb_mock.get("/movie/550").respond(
        json=tmdb_details(
            550,
            release_dates={"results": [{"iso_3166_1": "US", "release_dates": [{"certification": "R"}]}]},
        )
    )

    body = client.get("/api/tmdb/movies/550").json()

    assert body["certification"] == "R"
    assert body["tagline"] is None
    assert body["directors"] == []
    assert body["cast"] == []
    assert body["trailer_url"] is None
    assert body["collection"] is None


def test_movie_info_ignores_a_failed_collection(client: TestClient, tmdb_mock: respx.MockRouter) -> None:
    tmdb_mock.get("/movie/672").respond(json=_info_payload())
    tmdb_mock.get("/collection/1241").respond(500)

    response = client.get("/api/tmdb/movies/672")

    assert response.status_code == 200
    assert response.json()["collection"] is None
    assert response.json()["directors"] == ["Chris Columbus"]


def test_movie_info_is_cached(client: TestClient, tmdb_mock: respx.MockRouter) -> None:
    details = tmdb_mock.get("/movie/672").respond(json=_info_payload())
    collection = tmdb_mock.get("/collection/1241").respond(json=_collection_payload())

    client.get("/api/tmdb/movies/672")
    client.get("/api/tmdb/movies/672")

    assert details.call_count == 1
    assert collection.call_count == 1


def test_movie_info_not_found(client: TestClient, tmdb_mock: respx.MockRouter) -> None:
    tmdb_mock.get("/movie/1").respond(404)

    response = client.get("/api/tmdb/movies/1")

    assert response.status_code == 404
    assert "detail" in response.json()
