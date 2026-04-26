from pydantic import BaseModel, Field


class Creed(BaseModel):
    """A creed (e.g., Apostles' Creed)."""

    creed_id: int = Field(..., description="Creed ID")
    name: str = Field(..., description="Creed name")
    content: str = Field(
        ...,
        description=(
            "Raw creed text. Paragraphs separated by '||', lines within a "
            "paragraph separated by '|'."
        ),
    )