"""The compiled deck — a flat list of slides, one per screen.

Produced by compile_deck(). Consumed by two renderers: the React
SlideRenderer (which may re-split `scripture` slides after measuring
real overflow) and the .pptx exporter (which draws what it's given).

No pipe-delimited strings survive this layer. All '|' and '||' parsing
happens during compilation, so downstream code only ever sees list[str].
"""

from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field


class SlideBase(BaseModel):
    id: str = Field(..., description="Stable within a deck, e.g. 'a3f9c2e1-v3'")
    section_id: str = Field(..., description="Groups related slides, e.g. 'a3f9c2e1'")
    section_label: str = Field(
        ..., description="Shown in the control view, e.g. 'Hymn 2 — 20 Amazing Grace'"
    )


class NumberedVerse(BaseModel):
    number: int
    text: str


class TitleSlide(SlideBase):
    kind: Literal["title"] = "title"
    text: str
    subtitle: str = ""


class HymnVerseSlide(SlideBase):
    kind: Literal["hymn_verse"] = "hymn_verse"
    hymn_id: int
    hymn_title: str
    lines: list[str]
    verse_index: int = Field(..., ge=1, description="1-based")
    verse_count: int = Field(..., ge=1)
    show_header: bool = Field(
        ..., description="Title + underline. True on the first verse only."
    )
    is_last_verse: bool = Field(..., description="Renders the ***** marker")


class PrayerSlide(SlideBase):
    kind: Literal["prayer"] = "prayer"
    name: str
    led_by: str | None = None


class LiturgySlide(SlideBase):
    """The Apostles' Creed and The Lord's Prayer — identical rendering."""

    kind: Literal["liturgy"] = "liturgy"
    name: str
    blocks: list[list[str]] = Field(..., description="Paragraphs, each a list of lines")
    page: int = Field(..., ge=1)
    page_count: int = Field(..., ge=1)


class ScriptureSlide(SlideBase):
    kind: Literal["scripture"] = "scripture"
    reference: str
    verses: list[NumberedVerse]
    page: int = Field(..., ge=1)
    page_count: int = Field(..., ge=1)
    may_resplit: bool = Field(
        default=True,
        description=(
            "The only kind the HTML renderer may repaginate. Verse boundaries "
            "are the only legal split points."
        ),
    )


class KeyVerseSlide(SlideBase):
    kind: Literal["key_verse"] = "key_verse"
    reference: str
    verses: list[NumberedVerse]


Slide = Annotated[
    TitleSlide
    | HymnVerseSlide
    | PrayerSlide
    | LiturgySlide
    | ScriptureSlide
    | KeyVerseSlide,
    Field(discriminator="kind"),
]


class Deck(BaseModel):
    plan_id: str
    service_title: str
    slides: list[Slide] = Field(default_factory=list)

    def index_of(self, slide_id: str) -> int | None:
        """Position of a slide by id, or None if it isn't in this deck."""
        for i, slide in enumerate(self.slides):
            if slide.id == slide_id:
                return i
        return None