"""HTTP endpoints for creeds."""

from fastapi import APIRouter, Depends, HTTPException

from app.data.repository import DataRepository, get_repository
from app.models.creed import Creed

router = APIRouter(prefix="/api/creeds", tags=["creeds"])


@router.get("", response_model=list[Creed])
def list_creeds(repo: DataRepository = Depends(get_repository)) -> list[Creed]:
    """Return all creeds."""
    return repo.creeds


@router.get("/by-name/{name}", response_model=Creed)
def get_creed_by_name(
    name: str,
    repo: DataRepository = Depends(get_repository),
) -> Creed:
    """Find a creed by name (loose match: case-insensitive, ignores 'the' and apostrophes)."""
    creed = repo.get_creed_by_name(name)
    if not creed:
        raise HTTPException(status_code=404, detail=f"Creed '{name}' not found")
    return creed


@router.get("/{creed_id}", response_model=Creed)
def get_creed(
    creed_id: int,
    repo: DataRepository = Depends(get_repository),
) -> Creed:
    """Return a single creed by ID."""
    creed = repo.get_creed_by_id(creed_id)
    if not creed:
        raise HTTPException(status_code=404, detail=f"Creed {creed_id} not found")
    return creed