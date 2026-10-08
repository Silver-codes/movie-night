from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.db import get_session
from app.models import DEFAULT_PROFILES, PEOPLE, Person, PersonProfile, PersonProfileRead, PersonProfileUpdate

router = APIRouter(prefix="/people", tags=["people"])

SessionDep = Annotated[Session, Depends(get_session)]


def seed_people(session: Session) -> None:
    """Gives every person slot a profile row (defaults: Fuf and Cookie); existing rows are kept."""
    existing = set(session.exec(select(PersonProfile.id)).all())
    for person in PEOPLE:
        if person not in existing:
            name, emoji, color = DEFAULT_PROFILES[person]
            session.add(PersonProfile(id=person, name=name, emoji=emoji, color=color))
    session.commit()


def _profiles(session: Session) -> list[PersonProfile]:
    by_id = {profile.id: profile for profile in session.exec(select(PersonProfile)).all()}
    if any(person not in by_id for person in PEOPLE):
        seed_people(session)
        return _profiles(session)
    return [by_id[person] for person in PEOPLE]


@router.get("")
def list_people(session: SessionDep) -> list[PersonProfileRead]:
    """Both profiles, in `PEOPLE` order."""
    return [PersonProfileRead.model_validate(profile) for profile in _profiles(session)]


@router.patch("/{person}")
def update_person(person: Person, body: PersonProfileUpdate, session: SessionDep) -> PersonProfileRead:
    profiles = _profiles(session)
    profile = next(p for p in profiles if p.id == person)
    if body.name is not None and any(
        p.id != person and p.name.casefold() == body.name.casefold() for p in profiles
    ):
        raise HTTPException(status.HTTP_409_CONFLICT, "The other person already has that name")
    profile.sqlmodel_update(body.model_dump(exclude_unset=True))
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return PersonProfileRead.model_validate(profile)
