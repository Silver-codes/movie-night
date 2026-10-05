import sqlite3
from pathlib import Path

import pytest
from fastapi import APIRouter, FastAPI
from fastapi.testclient import TestClient

from app.frontend import mount_frontend
from scripts.backup_db import backup_database


@pytest.fixture
def spa_client(tmp_path: Path) -> TestClient:
    dist = tmp_path / "dist"
    (dist / "assets").mkdir(parents=True)
    (dist / "index.html").write_text("<!doctype html><title>Movie Night</title>")
    (dist / "assets" / "app.js").write_text("console.log('hi')")
    (dist / "favicon.svg").write_text("<svg/>")
    (tmp_path / "secret.txt").write_text("outside dist")

    api = APIRouter()

    @api.get("/ping")
    def ping() -> dict[str, bool]:
        return {"ok": True}

    app = FastAPI()
    app.include_router(api, prefix="/api")
    mount_frontend(app, dist)
    return TestClient(app)


@pytest.mark.parametrize("path", ["/", "/watchlist", "/history?movie=3"])
def test_client_routes_get_index(spa_client: TestClient, path: str) -> None:
    response = spa_client.get(path)
    assert response.status_code == 200
    assert "Movie Night" in response.text
    assert response.headers["cache-control"] == "no-cache"


def test_assets_and_root_files_are_served(spa_client: TestClient) -> None:
    script = spa_client.get("/assets/app.js")
    assert script.status_code == 200
    assert script.headers["content-type"].startswith("text/javascript")
    assert spa_client.get("/favicon.svg").text == "<svg/>"


def test_api_is_not_shadowed(spa_client: TestClient) -> None:
    assert spa_client.get("/api/ping").json() == {"ok": True}
    for path in ["/api", "/api/nope"]:
        response = spa_client.get(path)
        assert response.status_code == 404
        assert response.json() == {"detail": "Not Found"}


def test_files_outside_dist_are_not_served(spa_client: TestClient) -> None:
    response = spa_client.get("/..%2Fsecret.txt")
    assert "outside dist" not in response.text


def test_backup_copies_database(tmp_path: Path) -> None:
    db_path = tmp_path / "movie_night.db"
    with sqlite3.connect(db_path) as conn:
        conn.execute("CREATE TABLE movie (id INTEGER PRIMARY KEY, title TEXT)")
        conn.execute("INSERT INTO movie (title) VALUES ('Heat')")

    target = backup_database(db_path, tmp_path / "backups")

    with sqlite3.connect(target) as conn:
        assert conn.execute("SELECT title FROM movie").fetchall() == [("Heat",)]
