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


@router.post("", response_model=Hymn, status_code=201)
def create_hymn(
    hymn: Hymn,
    repo: DataRepository = Depends(get_repository),
) -> Hymn:
    """Add a new hymn to hymns.csv."""
    try:
        return repo.add_hymn(hymn)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.put("/{hymn_id}", response_model=Hymn)
def update_hymn(
    hymn_id: int,
    hymn: Hymn,
    repo: DataRepository = Depends(get_repository),
) -> Hymn:
    """Update an existing hymn in hymns.csv."""
    try:
        return repo.update_hymn(hymn_id, hymn)
    except ValueError as e:
        # Choose status code by message — "not found" vs "already exists"
        status = 404 if "not found" in str(e) else 409
        raise HTTPException(status_code=status, detail=str(e))


@router.delete("/{hymn_id}", status_code=204)
def delete_hymn(
    hymn_id: int,
    repo: DataRepository = Depends(get_repository),
) -> None:
    """Remove a hymn from hymns.csv."""
    try:
        repo.delete_hymn(hymn_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))