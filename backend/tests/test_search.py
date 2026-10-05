import httpx
import pytest
import respx
from fastapi.testclient import TestClient

from tests.factories import MakeMovie, tmdb_search_item


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
        },
        {
            "tmdb_id": 551,
            "title": "Original",
            "year": None,
            "overview": None,
            "poster_url": None,
            "tmdb_rating": None,
            "already_saved": False,
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
    make_movie(tmdb_id=550)
    tmdb_mock.get("/search/movie").respond(
        json={"results": [tmdb_search_item(550), tmdb_search_item(551)]}
    )

    saved = {r["tmdb_id"]: r["already_saved"] for r in client.get("/api/search?q=x").json()}

    assert saved == {550: True, 551: False}


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
