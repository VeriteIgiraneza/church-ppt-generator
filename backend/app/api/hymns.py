from fastapi import APIRouter, Depends, HTTPException, Query

from app.data.repository import DataRepository, get_repository
from app.models.hymn import Hymn

router = APIRouter(prefix="/api/hymns", tags=["hymns"])


@router.get("", response_model=list[Hymn])
def list_hymns(repo: DataRepository = Depends(get_repository)) -> list[Hymn]:
    """Return all hymns."""
    return repo.hymns


@router.get("/search", response_model=list[Hymn])
def search_hymns(
    q: str = Query("", description="Search query (matches title, author, category, or hymn ID)"),
    repo: DataRepository = Depends(get_repository),
) -> list[Hymn]:
    """Search hymns by title, author, category, or hymn number."""
    return repo.search_hymns(q)


@router.get("/{hymn_id}", response_model=Hymn)
def get_hymn(
    hymn_id: int,
    repo: DataRepository = Depends(get_repository),
) -> Hymn:
    """Return a single hymn by ID."""
    for hymn in repo.hymns:
        if hymn.hymn_id == hymn_id:
            return hymn
    raise HTTPException(status_code=404, detail=f"Hymn {hymn_id} not found")