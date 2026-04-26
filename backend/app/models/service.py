"""Request models for generating a church service presentation.

These describe what the client sends in the POST body. The service builder
turns one of these into the actual ordered list of slides.
"""

from pydantic import BaseModel, Field


class BibleReference(BaseModel):
    """A range of Bible verses (used for both main reading and key verse)."""

    book: str
    chapter: int = Field(..., ge=1)
    start_verse: int = Field(..., ge=1)
    end_verse: int = Field(..., ge=1)


class GeneratePresentationRequest(BaseModel):
    """Everything the user picks in the UI to build a presentation."""

    service_title: str = Field(..., min_length=1, description="Service title")
    hymn_ids: list[int] = Field(
        ..., min_length=4, max_length=4, description="The 4 selected hymn IDs"
    )
    prayer_leader: str = Field(
        ..., min_length=1, description="Name of the Representative Prayer leader"
    )
    bible_reading: BibleReference = Field(..., description="Main Bible reading passage")
    key_verse: BibleReference = Field(..., description="Key verse passage")
    creed_name: str = Field(
        default="The Apostles' Creed",
        description="Name of the creed to include between prayers",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "service_title": "Sunday Morning Worship",
                    "hymn_ids": [1, 2, 3, 4],
                    "prayer_leader": "Jane Doe",
                    "bible_reading": {
                        "book": "John",
                        "chapter": 3,
                        "start_verse": 16,
                        "end_verse": 17,
                    },
                    "key_verse": {
                        "book": "John",
                        "chapter": 3,
                        "start_verse": 16,
                        "end_verse": 16,
                    },
                    "creed_name": "The Apostles' Creed",
                }
            ]
        }
    }