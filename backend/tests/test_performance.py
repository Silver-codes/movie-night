from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import Engine, event, text
from sqlmodel import Session, create_engine

from app import db as db_module
from app.models import MovieStatus, Pick, PickMethod
from tests.factories import MakeMovie


def test_file_database_uses_wal(tmp_path: Path) -> None:
    file_engine = create_engine(f"sqlite:///{tmp_path / 'test.db'}")
    event.listen(file_engine, "connect", db_module.tune_sqlite)
    with file_engine.connect() as conn:
        assert conn.execute(text("PRAGMA journal_mode")).scalar() == "wal"
        assert conn.execute(text("PRAGMA synchronous")).scalar() == 1  # NORMAL
    file_engine.dispose()


def test_json_responses_are_gzipped(client: TestClient, make_movie: MakeMovie) -> None:
    for _ in range(10):
        make_movie(overview="A long overview. " * 20)
    response = client.get("/api/movies", headers={"Accept-Encoding": "gzip"})
    assert response.headers["content-encoding"] == "gzip"
    assert len(response.json()) == 10


def test_movie_list_does_not_query_per_movie(
    client: TestClient, engine: Engine, session: Session, make_movie: MakeMovie
) -> None:
    for _ in range(5):
        movie = make_movie(status=MovieStatus.watchlist)
        session.add(Pick(movie_id=movie.id, method=PickMethod.wheel_random, confirmed=True))
    session.commit()

    statements: list[str] = []

    def count(*args: object) -> None:
        statements.append(str(args[2]))

    event.listen(engine, "before_cursor_execute", count)
    try:
        response = client.get("/api/movies")
    finally:
        event.remove(engine, "before_cursor_execute", count)

    assert response.status_code == 200
    assert all(m["confirmed_pick_method"] == "wheel_random" for m in response.json())
    # One query for the movies, one (selectin) for all their picks.
    assert len([s for s in statements if s.lstrip().upper().startswith("SELECT")]) == 2
