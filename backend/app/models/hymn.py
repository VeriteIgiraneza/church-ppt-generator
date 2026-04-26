from pydantic import BaseModel, Field


class Hymn(BaseModel):
    """A hymn from the hymnbook."""

    hymn_id: int = Field(..., description="Hymn number (1-based)")
    title: str = Field(..., description="Hymn title")
    author: str = Field(default="", description="Author / composer")
    category: str = Field(default="", description="Category (e.g., Praise, Worship)")
    verses: str = Field(
        ...,
        description=(
            "Raw verse text. Verses separated by '||', lines within a verse "
            "separated by '|'. Example: 'Line 1|Line 2||Verse 2 line 1|Verse 2 line 2'"
        ),
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "hymn_id": 1,
                    "title": "Amazing Grace",
                    "author": "John Newton",
                    "category": "Worship",
                    "verses": "Amazing grace, how sweet the sound|That saved a wretch like me||I once was lost, but now am found|Was blind, but now I see",
                }
            ]
        }
    }