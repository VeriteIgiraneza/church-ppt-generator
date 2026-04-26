from pydantic import BaseModel, Field


class BibleVerse(BaseModel):
    """A single Bible verse."""

    book: str = Field(..., description="Book name (e.g., 'John')")
    chapter: int = Field(..., ge=1, description="Chapter number")
    verse: int = Field(..., ge=1, description="Verse number")
    text: str = Field(..., description="Verse text")