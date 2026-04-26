from pydantic import BaseModel, Field


class PrayerLeader(BaseModel):
    """A person who can lead the representative prayer."""

    name: str = Field(..., description="Person's name")