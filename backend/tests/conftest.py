from collections.abc import Iterator
from typing import Any

import pytest
import respx
from fastapi.testclient import TestClient
from sqlalchemy import Engine, event
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, create_engine

from app import db as db_module
from app import main as main_module
from app.config import Settings
from app.models import Movie
from app.tmdb import TMDB_API_URL
from tests.factories import MakeMovie


@pytest.fixture
def engine() -> Iterator[Engine]:
    # One shared connection, so every session sees the same in-memory database.
    test_engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    event.listen(test_engine, "connect", db_module.enable_sqlite_foreign_keys)
    yield test_engine
    test_engine.dispose()


@pytest.fixture
def tmdb_token() -> str:
    return "test-token"


@pytest.fixture
def client(
    engine: Engine, tmdb_token: str, monkeypatch: pytest.MonkeyPatch
) -> Iterator[TestClient]:
    # Lifespan's create_db_and_tables() and get_session both read the module-level engine.
    monkeypatch.setattr(db_module, "engine", engine)
    # Never read the real backend/.env in tests.
    settings = Settings(tmdb_token=tmdb_token, _env_file=None)  # type: ignore[call-arg]
    monkeypatch.setattr(main_module, "get_settings", lambda: settings)
    with TestClient(main_module.app) as test_client:
        yield test_client


@pytest.fixture
def tmdb_mock() -> Iterator[respx.MockRouter]:
    # Any request to a route that isn't mocked fails, so tests never reach the real TMDB.
    with respx.mock(base_url=TMDB_API_URL, assert_all_called=False) as mock:
        yield mock


@pytest.fixture
def session(client: TestClient, engine: Engine) -> Iterator[Session]:
    # Depends on `client` so the tables exist.
    with Session(engine) as test_session:
        yield test_session


@pytest.fixture
def make_movie(session: Session) -> MakeMovie:
    counter = iter(range(1, 10_000))

    def _make(**overrides: Any) -> Movie:
        n = next(counter)
        movie = Movie(**{"tmdb_id": 1000 + n, "title": f"Movie {n}", **overrides})
        session.add(movie)
        session.commit()
        session.refresh(movie)
        return movie

    return _make
