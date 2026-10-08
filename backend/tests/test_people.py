from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.api.people import seed_people
from app.models import PersonColor, PersonProfile


def _people(client: TestClient) -> list[dict[str, Any]]:
    response = client.get("/api/people")
    assert response.status_code == 200
    body: list[dict[str, Any]] = response.json()
    return body


def test_defaults_are_seeded(client: TestClient) -> None:
    assert _people(client) == [
        {"id": "fuf", "name": "Fuf", "emoji": "🐻", "color": "lavender"},
        {"id": "cookie", "name": "Cookie", "emoji": "🍪", "color": "rose"},
    ]


def test_seeding_keeps_existing_profiles(client: TestClient, session: Session) -> None:
    client.patch("/api/people/cookie", json={"name": "Anna"})
    seed_people(session)

    assert [p["name"] for p in _people(client)] == ["Fuf", "Anna"]


def test_missing_rows_are_recreated(client: TestClient, session: Session) -> None:
    profile = session.get(PersonProfile, "fuf")
    session.delete(profile)
    session.commit()

    assert [p["id"] for p in _people(client)] == ["fuf", "cookie"]


def test_update_changes_only_sent_fields(client: TestClient) -> None:
    response = client.patch("/api/people/fuf", json={"name": "  Pepa  ", "color": "mint"})

    assert response.status_code == 200
    assert response.json() == {"id": "fuf", "name": "Pepa", "emoji": "🐻", "color": "mint"}
    assert _people(client)[0] == response.json()


def test_update_emoji_with_several_code_points(client: TestClient) -> None:
    emoji = "👩🏽‍🚀"
    response = client.patch("/api/people/cookie", json={"emoji": emoji})

    assert response.status_code == 200
    assert response.json()["emoji"] == emoji


@pytest.mark.parametrize(
    "body",
    [
        {"name": ""},
        {"name": "   "},
        {"name": "x" * 21},
        {"name": None},
        {"emoji": ""},
        {"emoji": None},
        {"color": "plaid"},
        {"color": None},
    ],
)
def test_invalid_update_is_rejected(client: TestClient, body: dict[str, Any]) -> None:
    assert client.patch("/api/people/fuf", json=body).status_code == 422
    assert _people(client)[0]["name"] == "Fuf"


def test_unknown_person_is_rejected(client: TestClient) -> None:
    assert client.patch("/api/people/bob", json={"name": "Bob"}).status_code == 422


def test_duplicate_name_is_rejected(client: TestClient) -> None:
    response = client.patch("/api/people/fuf", json={"name": "cookie"})

    assert response.status_code == 409
    assert _people(client)[0]["name"] == "Fuf"


def test_renaming_to_own_name_in_another_case_is_fine(client: TestClient) -> None:
    response = client.patch("/api/people/fuf", json={"name": "FUF"})

    assert response.status_code == 200
    assert response.json()["name"] == "FUF"


def test_both_people_can_share_a_color(client: TestClient) -> None:
    # The frontend keeps colors apart; the API doesn't need to.
    response = client.patch("/api/people/fuf", json={"color": PersonColor.rose.value})

    assert response.status_code == 200
