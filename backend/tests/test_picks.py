import random
from datetime import UTC, date, datetime, timedelta
from collections import Counter
from collections.abc import Callable, Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import Engine
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


def test_a_pick_waiting_for_its_verdict_is_out_of_the_hat(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng
) -> None:
    tonight = make_movie(title="Tonight", fuf_hype=5)
    make_movie(title="Other")
    client.post(f"/api/picks/{_pick(client, 'top_rated')['pick_id']}/confirm")

    read = client.get(f"/api/movies/{tonight.id}").json()
    assert (read["awaiting_verdict"], read["is_pickable"]) == (True, False)
    for method in PickMethod:
        assert [c["movie"]["title"] for c in _pick(client, method.value)["candidates"]] == ["Other"]

    # "Didn't watch it" puts it back in the hat.
    assert client.delete(f"/api/movies/{tonight.id}/pick").json()["is_pickable"] is True
    assert len(_pick(client, "wheel_random")["candidates"]) == 2


def test_picked_at_is_the_latest_confirmed_pick_in_utc(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng
) -> None:
    movie = make_movie()
    assert client.get(f"/api/movies/{movie.id}").json()["picked_at"] is None
    before = datetime.now(UTC)
    client.post(f"/api/picks/{_pick(client, 'wheel_random')['pick_id']}/confirm")

    picked_at = datetime.fromisoformat(client.get(f"/api/movies/{movie.id}").json()["picked_at"])
    assert picked_at.utcoffset() == timedelta(0)
    assert before - timedelta(seconds=1) <= picked_at <= datetime.now(UTC)


def test_awaiting_verdict_sql_matches_python_around_the_rollover(session: Session, make_movie: MakeMovie) -> None:
    night = date(2026, 10, 20)
    # Local pick times either side of 06:00 on the next morning, against a watch on `night`.
    local_times = [
        datetime(2026, 10, 20, 21, 0),
        datetime(2026, 10, 21, 5, 59),
        datetime(2026, 10, 21, 6, 0),
        datetime(2026, 10, 21, 23, 30),
    ]
    movies: list[Movie] = []
    for local in local_times:
        for watched_on in (None, night):
            movie = make_movie(watched_on=watched_on)
            assert movie.id is not None
            picked_at = local.astimezone().astimezone(UTC)
            session.add(Pick(movie_id=movie.id, method=PickMethod.wheel_random, picked_at=picked_at))
            movies.append(movie)
    session.commit()

    in_sql = set(session.exec(select(Movie.id).where(Movie.awaiting_verdict_filter())).all())
    for movie in movies:
        session.refresh(movie)
    in_python = {movie.id for movie in movies if movie.awaiting_verdict}

    assert in_sql == in_python
    # Never watched: always awaiting. Watched on `night`: only picks from 06:00 the next morning on.
    assert len(in_python) == len(local_times) + 2


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


def test_pick_is_not_saved_until_confirmed(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng, session: Session
) -> None:
    movie = make_movie()

    body = _pick(client, "wheel_weighted")

    assert isinstance(body["pick_id"], str)
    assert body["winner"]["id"] == movie.id
    assert session.exec(select(Pick)).all() == []
    assert body["winner"]["confirmed_pick_method"] is None
    assert body["winner"]["awaiting_verdict"] is False


def test_confirm_pick(client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng, session: Session) -> None:
    movie = make_movie()
    pick_id = _pick(client, "top_rated")["pick_id"]

    response = client.post(f"/api/picks/{pick_id}/confirm")

    assert response.status_code == 200
    body = response.json()
    assert body["movie_id"] == movie.id
    assert body["method"] == "top_rated"
    assert body["confirmed"] is True
    # Confirming again returns the same saved pick, without a second row.
    again = client.post(f"/api/picks/{pick_id}/confirm").json()
    assert again["id"] == body["id"]
    assert len(session.exec(select(Pick)).all()) == 1
    # The movie now knows it's been picked, for the "rate it after watching" reminder.
    read = client.get(f"/api/movies/{movie.id}").json()
    assert read["confirmed_pick_method"] == "top_rated"
    assert read["awaiting_verdict"] is True


def test_confirm_top_rated_can_take_another_place(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng, session: Session
) -> None:
    make_movie(title="First", fuf_hype=5, cookie_hype=5)
    second = make_movie(title="Second", fuf_hype=3, cookie_hype=3)
    body = _pick(client, "top_rated")
    assert body["winner"]["title"] == "First"

    response = client.post(f"/api/picks/{body['pick_id']}/confirm", json={"movie_id": second.id})

    assert response.status_code == 200
    assert response.json()["movie_id"] == second.id
    assert [pick.movie_id for pick in session.exec(select(Pick)).all()] == [second.id]
    read = client.get(f"/api/movies/{second.id}").json()
    assert read["confirmed_pick_method"] == "top_rated"
    assert read["awaiting_verdict"] is True


def test_confirm_with_a_movie_outside_the_pick_is_400(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng, session: Session
) -> None:
    make_movie(title="Short", runtime=90)
    too_long = make_movie(title="Long", runtime=200)
    pick_id = _pick(client, "top_rated", max_runtime=120)["pick_id"]

    response = client.post(f"/api/picks/{pick_id}/confirm", json={"movie_id": too_long.id})

    assert response.status_code == 400
    assert response.json() == {"detail": "That movie isn't in this pick"}
    assert session.exec(select(Pick)).all() == []


def test_confirm_wheel_only_takes_the_winner(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng, session: Session
) -> None:
    make_movie(title="A")
    make_movie(title="B")
    body = _pick(client, "wheel_random")
    loser = next(c["movie"]["id"] for c in body["candidates"] if c["movie"]["id"] != body["winner"]["id"])

    response = client.post(f"/api/picks/{body['pick_id']}/confirm", json={"movie_id": loser})

    assert response.status_code == 400
    # Naming the winner itself is fine.
    winner = client.post(f"/api/picks/{body['pick_id']}/confirm", json={"movie_id": body["winner"]["id"]})
    assert winner.status_code == 200
    assert winner.json()["movie_id"] == body["winner"]["id"]


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


def test_confirm_unknown_pick_is_404(client: TestClient) -> None:
    response = client.post("/api/picks/not-a-pick/confirm")

    assert response.status_code == 404
    assert response.json() == {"detail": "This pick has expired. Pick again."}


def test_confirm_after_the_movie_was_deleted_is_404(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng
) -> None:
    movie = make_movie()
    pick_id = _pick(client, "top_rated")["pick_id"]
    client.delete(f"/api/movies/{movie.id}")

    response = client.post(f"/api/picks/{pick_id}/confirm")

    assert response.status_code == 404
    assert response.json() == {"detail": "Movie not found"}


# --- cancelling a confirmed pick ("didn't watch it after all") ---


def test_cancel_pick_undoes_the_confirm(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng, session: Session
) -> None:
    movie = make_movie(fuf_hype=4)
    client.post(f"/api/picks/{_pick(client, 'top_rated')['pick_id']}/confirm")

    response = client.delete(f"/api/movies/{movie.id}/pick")

    assert response.status_code == 200
    body = response.json()
    assert body["awaiting_verdict"] is False
    assert body["confirmed_pick_method"] is None
    # Still on the watchlist, hype kept, in the hat again.
    assert body["status"] == "watchlist"
    assert body["fuf_hype"] == 4
    assert body["is_pickable"] is True
    assert session.exec(select(Pick)).all() == []


def test_cancel_pick_removes_only_the_latest(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng, session: Session
) -> None:
    first = make_movie(title="First", fuf_hype=5, cookie_hype=5)
    second = make_movie(title="Second", fuf_hype=1)
    client.post(f"/api/picks/{_pick(client, 'top_rated')['pick_id']}/confirm")
    # The Top Rated place they chose instead of #1 is the one cancelled.
    other = _pick(client, "top_rated")["pick_id"]
    client.post(f"/api/picks/{other}/confirm", json={"movie_id": second.id})

    assert client.delete(f"/api/movies/{second.id}/pick").status_code == 200

    assert [pick.movie_id for pick in session.exec(select(Pick)).all()] == [first.id]
    assert client.get(f"/api/movies/{first.id}").json()["awaiting_verdict"] is True


def test_cancel_pick_without_a_waiting_pick_is_409(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng, session: Session
) -> None:
    never_picked = make_movie(title="Never picked")
    watched = make_movie(title="Watched")
    client.post(f"/api/picks/{_pick(client, 'top_rated')['pick_id']}/confirm")
    client.post(f"/api/movies/{watched.id}/watched", json={"fuf_verdict": 4})

    for movie in (never_picked, watched):
        response = client.delete(f"/api/movies/{movie.id}/pick")
        assert response.status_code == 409
        assert response.json() == {"detail": "This movie isn't waiting to be watched"}
    # A watched movie keeps its pick: History shows how it was chosen.
    assert len(session.exec(select(Pick)).all()) == 1


def test_cancel_pick_unknown_movie_is_404(client: TestClient) -> None:
    assert client.delete("/api/movies/999/pick").status_code == 404


def test_old_unconfirmed_picks_are_deleted_on_startup(engine: Engine, session: Session, make_movie: MakeMovie) -> None:
    movie = make_movie()
    assert movie.id is not None
    session.add(Pick(movie_id=movie.id, method=PickMethod.top_rated, confirmed=False))
    session.add(Pick(movie_id=movie.id, method=PickMethod.wheel_random, confirmed=True))
    session.commit()

    with TestClient(app):  # runs the lifespan again
        pass

    session.expire_all()
    assert [pick.method for pick in session.exec(select(Pick)).all()] == [PickMethod.wheel_random]


# --- "rate it after watching" ---


def _confirm(client: TestClient) -> None:
    pick_id = _pick(client, "top_rated")["pick_id"]
    assert client.post(f"/api/picks/{pick_id}/confirm").status_code == 200


def test_moved_back_to_watchlist_is_not_awaiting_until_picked_again(
    client: TestClient, make_movie: MakeMovie, seed_rng: SeedRng, session: Session
) -> None:
    movie = make_movie()
    assert movie.id is not None
    _confirm(client)
    client.post(f"/api/movies/{movie.id}/watched", json={"fuf_verdict": 4})

    moved = client.patch(f"/api/movies/{movie.id}", json={"status": "watchlist"}).json()

    # Verdicts and the last watch date are kept; the old pick doesn't ask for a rating again.
    assert moved["status"] == "watchlist"
    assert moved["fuf_verdict"] == 4
    assert moved["watched_on"] == movie_night_date().isoformat()
    assert moved["confirmed_pick_method"] == "top_rated"
    assert moved["awaiting_verdict"] is False

    # Picked again on a later movie night.
    later = datetime.now(UTC) + timedelta(days=1)
    session.add(Pick(movie_id=movie.id, method=PickMethod.wheel_random, picked_at=later))
    session.commit()
    read = client.get(f"/api/movies/{movie.id}").json()
    assert read["confirmed_pick_method"] == "wheel_random"
    assert read["awaiting_verdict"] is True
