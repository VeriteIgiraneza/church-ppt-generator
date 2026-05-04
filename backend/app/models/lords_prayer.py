from pydantic import BaseModel, Field


class LordsPrayer(BaseModel):
    """The Lord's Prayer — appears as the final slides of every service."""

    prayer_id: int = Field(..., description="Internal ID")
    name: str = Field(..., description="Display name (typically 'The Lord's Prayer')")
    content: str = Field(
        ...,
        description=(
            "Raw prayer text. Paragraphs separated by '||', lines within a "
            "paragraph separated by '|'."
        ),
    )