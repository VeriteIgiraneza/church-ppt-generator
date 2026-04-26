"""HTTP endpoints for Bible data."""

from fastapi import APIRouter, Depends, HTTPException, Query

from app.data.repository import DataRepository, get_repository
from app.models.bible import BibleVerse

router = APIRouter(prefix="/api/bible", tags=["bible"])


@router.get("/books", response_model=list[str])
def list_books(repo: DataRepository = Depends(get_repository)) -> list[str]:
    """Return all Bible book names."""
    return repo.get_bible_books()


@router.get("/chapters/{book}", response_model=list[int])
def list_chapters(
    book: str,
    repo: DataRepository = Depends(get_repository),
) -> list[int]:
    """Return chapter numbers for the given book."""
    chapters = repo.get_bible_chapters(book)
    if not chapters:
        raise HTTPException(status_code=404, detail=f"Book '{book}' not found")
    return chapters


@router.get("/verses/{book}/{chapter}", response_model=list[int])
def list_verse_numbers(
    book: str,
    chapter: int,
    repo: DataRepository = Depends(get_repository),
) -> list[int]:
    """Return verse numbers in the given chapter."""
    verses = repo.get_bible_verse_numbers(book, chapter)
    if not verses:
        raise HTTPException(
            status_code=404, detail=f"No verses found for {book} {chapter}"
        )
    return verses


@router.get("/passage", response_model=list[BibleVerse])
def get_passage(
    book: str = Query(..., description="Book name, e.g. 'John'"),
    chapter: int = Query(..., ge=1),
    start_verse: int = Query(..., ge=1),
    end_verse: int = Query(..., ge=1),
    repo: DataRepository = Depends(get_repository),
) -> list[BibleVerse]:
    """Return the verses in [start_verse, end_verse] for a chapter."""
    if end_verse < start_verse:
        raise HTTPException(
            status_code=400, detail="end_verse must be >= start_verse"
        )
    verses = repo.get_bible_passage(book, chapter, start_verse, end_verse)
    if not verses:
        raise HTTPException(
            status_code=404,
            detail=f"No verses found for {book} {chapter}:{start_verse}-{end_verse}",
        )
    return verses