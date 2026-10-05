import random
from collections import Counter
from collections.abc import Callable, Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from app.api.picks import choose, get_rng
from app.main import app
from app.models import Movie, MovieStatus, Pick, PickMethod, movie_night_date
from tests.factories import MakeMovie

SeedRng = Callable[[int], None]


@pytest.fixture
def seed_rng(client: TestClient) -> Iterator[SeedRng]:
    """Makes POST /picks use `random.Random(seed)`, so the winner is deterministic."""

    def _seed(seed: int) -> None:
        rng = random.Random(seed)
        app.dependency_overrides[get_rng] = lambda: rng

    _seed(0)
    yield _seed
    app.dependency_overrides.pop(get_rng, None)


def _pick(client: TestClient, method: str, **filters: Any) -> dict[str, Any]:
    response = client.post("/api/picks", json={"method": method, **filters})
    assert response.status_code == 201, response.text
    body: dict[str, Any] = response.json()
    return body


def _probabilities(body: dict[str, Any]) -> dict[str, float]:
    return {c["movie"]["title"]: c["probability"] for c in body["candidates"]}


def _weights(body: dict[str, Any]) -> dict[str, float]:
    return {c["movie"]["title"]: c["weight"] for c in body["candidates"]}


def _winners(method: PickMethod, movies: list[Movie], runs: int = 500) -> Counter[str]:
    rng = random.Random(42)
    return Counter(choose(method, movies, rng)[0].title for _ in range(runs))


# --- wheel_weighted ---


def test_weighted_probabilities_follow_hype_total(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng
) -> None:
    make_movie(title="A", fuf_hype=1, cookie_hype=1)
    make_movie(title="B", fuf_hype=5, cookie_hype=1)
    make_movie(title="C")

    body = _pick(client, "wheel_weighted")

    assert _weights(body) == {"A": 2, "B": 6, "C": 1}
    assert _probabilities(body) == pytest.approx({"A": 2 / 9, "B": 6 / 9, "C": 1 / 9})
    assert sum(_probabilities(body).values()) == pytest.approx(1)
    assert body["winner"]["title"] in {"A", "B", "C"}


def test_weighted_unrated_movies_get_weight_one(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng
) -> None:
    make_movie(title="Unrated")
    make_movie(title="Also unrated")

    body = _pick(client, "wheel_weighted")

    assert _weights(body) == {"Unrated": 1, "Also unrated": 1}
    assert _probabilities(body) == pytest.approx({"Unrated": 0.5, "Also unrated": 0.5})


def test_weighted_winner_frequencies_match_weights() -> None:
    movies = [
        Movie(id=1, tmdb_id=1, title="Low", fuf_hype=1),
        Movie(id=2, tmdb_id=2, title="High", fuf_hype=5, cookie_hype=4),
    ]

    winners = _winners(PickMethod.wheel_weighted, movies, runs=2000)

    assert winners["High"] / 2000 == pytest.approx(0.9, abs=0.03)


# --- wheel_random ---


def test_random_is_uniform_and_ignores_hype(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng
) -> None:
    make_movie(title="A", fuf_hype=5, cookie_hype=5)
    make_movie(title="B")
    make_movie(title="C", fuf_hype=1)
    make_movie(title="D")

    body = _pick(client, "wheel_random")

    assert _weights(body) == {"A": 1, "B": 1, "C": 1, "D": 1}
    assert _probabilities(body) == pytest.approx({t: 0.25 for t in "ABCD"})
    # Wheel slices come in a stable (title) order.
    assert [c["movie"]["title"] for c in body["candidates"]] == ["A", "B", "C", "D"]


def test_same_seed_gives_same_winner(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng
) -> None:
    for title in "ABCDEFGH":
        make_movie(title=title)

    seed_rng(7)
    first = _pick(client, "wheel_random")["winner"]["id"]
    seed_rng(7)
    second = _pick(client, "wheel_random")["winner"]["id"]

    assert first == second


def test_random_every_movie_can_win() -> None:
    movies = [Movie(id=n, tmdb_id=n, title=f"M{n}") for n in range(1, 5)]

    assert set(_winners(PickMethod.wheel_random, movies)) == {"M1", "M2", "M3", "M4"}


# --- top_rated ---


def test_top_rated_highest_hype_total_wins(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng
) -> None:
    make_movie(title="Meh", fuf_hype=2)
    make_movie(title="Best", fuf_hype=5, cookie_hype=4)
    make_movie(title="Good", fuf_hype=4, cookie_hype=3)

    body = _pick(client, "top_rated")

    assert body["winner"]["title"] == "Best"
    # Ranked by hype total.
    assert [c["movie"]["title"] for c in body["candidates"]] == ["Best", "Good", "Meh"]
    assert _weights(body) == {"Best": 9, "Good": 7, "Meh": 2}
    assert _probabilities(body) == {"Best": 1, "Good": 0, "Meh": 0}


def test_top_rated_ties_are_broken_randomly(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng
) -> None:
    make_movie(title="Tie 1", fuf_hype=5)
    make_movie(title="Tie 2", cookie_hype=5)
    make_movie(title="Lower", fuf_hype=4)

    body = _pick(client, "top_rated")
    assert _probabilities(body) == {"Tie 1": 0.5, "Tie 2": 0.5, "Lower": 0}

    winners: Counter[str] = Counter()
    for seed in range(40):
        seed_rng(seed)
        winners[_pick(client, "top_rated")["winner"]["title"]] += 1
    assert set(winners) == {"Tie 1", "Tie 2"}


# --- filters and candidates ---


def test_only_pickable_movies_are_candidates(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng
) -> None:
    make_movie(title="Pickable")
    make_movie(title="Watched", status=MovieStatus.watched, fuf_hype=5)
    make_movie(title="Skipped", skipped_on=movie_night_date(), fuf_hype=5)

    for method in PickMethod:
        body = _pick(client, method.value)
        assert [c["movie"]["title"] for c in body["candidates"]] == ["Pickable"]
        assert body["winner"]["title"] == "Pickable"


def test_genre_filter(client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng) -> None:
    make_movie(title="Scary", genres=["Horror", "Thriller"])
    make_movie(title="Funny", genres=["Comedy"])

    body = _pick(client, "wheel_random", genre="horror")

    assert [c["movie"]["title"] for c in body["candidates"]] == ["Scary"]


def test_max_runtime_filter_excludes_longer_and_unknown(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng
) -> None:
    make_movie(title="Short", runtime=90)
    make_movie(title="Exactly 2h", runtime=120)
    make_movie(title="Long", runtime=180)
    make_movie(title="Unknown", runtime=None)

    body = _pick(client, "wheel_weighted", max_runtime=120)

    assert {c["movie"]["title"] for c in body["candidates"]} == {"Short", "Exactly 2h"}


def test_filters_combine(client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng) -> None:
    make_movie(title="Short comedy", runtime=90, genres=["Comedy"])
    make_movie(title="Long comedy", runtime=150, genres=["Comedy"])
    make_movie(title="Short drama", runtime=90, genres=["Drama"])

    body = _pick(client, "top_rated", max_runtime=100, genre="Comedy")

    assert [c["movie"]["title"] for c in body["candidates"]] == ["Short comedy"]


def test_empty_watchlist_is_400(client: TestClient, seed_rng: SeedRng) -> None:
    for method in PickMethod:
        response = client.post("/api/picks", json={"method": method.value})
        assert response.status_code == 400
        assert response.json() == {"detail": "No pickable movies match"}


def test_no_match_for_filters_is_400(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng, session: Session
) -> None:
    make_movie(genres=["Drama"])

    response = client.post("/api/picks", json={"method": "wheel_random", "genre": "Horror"})

    assert response.status_code == 400
    assert session.exec(select(Pick)).all() == []


@pytest.mark.parametrize(
    "body", [{}, {"method": "nope"}, {"method": "top_rated", "max_runtime": 0}]
)
def test_invalid_request_is_422(client: TestClient, body: dict[str, Any]) -> None:
    assert client.post("/api/picks", json=body).status_code == 422


# --- saving and confirming ---


def test_pick_is_saved_unconfirmed(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng, session: Session
) -> None:
    movie = make_movie()

    body = _pick(client, "wheel_weighted")

    pick = session.get(Pick, body["pick_id"])
    assert pick is not None
    assert pick.movie_id == movie.id == body["winner"]["id"]
    assert pick.method == PickMethod.wheel_weighted == body["method"]
    assert pick.confirmed is False
    assert body["winner"]["confirmed_pick_method"] is None


def test_confirm_pick(client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng) -> None:
    movie = make_movie()
    pick_id = _pick(client, "top_rated")["pick_id"]

    response = client.post(f"/api/picks/{pick_id}/confirm")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == pick_id
    assert body["movie_id"] == movie.id
    assert body["confirmed"] is True
    # Confirming again is harmless.
    assert client.post(f"/api/picks/{pick_id}/confirm").json()["confirmed"] is True
    # The movie now knows it's been picked, for the "rate it after watching" reminder.
    assert client.get(f"/api/movies/{movie.id}").json()["confirmed_pick_method"] == "top_rated"


def test_confirmed_pick_method_is_the_latest_confirmed(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng
) -> None:
    movie = make_movie()
    first = _pick(client, "top_rated")["pick_id"]
    _pick(client, "wheel_random")  # never confirmed
    third = _pick(client, "wheel_weighted")["pick_id"]
    client.post(f"/api/picks/{first}/confirm")
    client.post(f"/api/picks/{third}/confirm")

    assert client.get(f"/api/movies/{movie.id}").json()["confirmed_pick_method"] == "wheel_weighted"


def test_confirm_missing_pick_is_404(client: TestClient) -> None:
    response = client.post("/api/picks/123/confirm")

    assert response.status_code == 404
    assert response.json() == {"detail": "Pick not found"}
