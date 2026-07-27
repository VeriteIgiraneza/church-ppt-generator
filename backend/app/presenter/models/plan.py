"""The editable service plan — an ordered list of steps.

A plan is a DRAFT. Most payload fields are optional because a plan exists
from the moment the user creates it, long before they've chosen a hymn or
a Bible reading. Use `validate_plan()` to find out what's still missing;
`compile_deck()` refuses to build from an incomplete plan.
"""

from __future__ import annotations

from datetime import datetime
from typing import Annotated, Literal, Self
from uuid import uuid4

from pydantic import BaseModel, Field

from app.models.service import BibleReference


def _step_id() -> str:
    """Short unique id. Used as the React key when dragging steps around."""
    return uuid4().hex[:8]


class StepBase(BaseModel):
    id: str = Field(default_factory=_step_id)

    def with_new_id(self) -> Self:
        """Copy of this step carrying a fresh id. Used when duplicating a plan."""
        return self.model_copy(update={"id": _step_id()})


class TitleStep(StepBase):
    """Service title + Bible reference. Appears twice in the default order."""

    kind: Literal["title"] = "title"


class HymnStep(StepBase):
    kind: Literal["hymn"] = "hymn"
    hymn_id: int | None = Field(
        default=None, description="Hymnal number. None = not yet chosen."
    )


class PrayerStep(StepBase):
    """A title-only prayer slide. `led_by` adds a 'Led by:' line."""

    kind: Literal["prayer"] = "prayer"
    name: str
    led_by: str | None = None


class CreedStep(StepBase):
    kind: Literal["creed"] = "creed"
    creed_name: str = "The Apostles' Creed"


class LordsPrayerStep(StepBase):
    kind: Literal["lords_prayer"] = "lords_prayer"


class ScriptureStep(StepBase):
    kind: Literal["scripture"] = "scripture"
    ref: BibleReference | None = None


class KeyVerseStep(StepBase):
    kind: Literal["key_verse"] = "key_verse"
    ref: BibleReference | None = None


Step = Annotated[
    TitleStep
    | HymnStep
    | PrayerStep
    | CreedStep
    | LordsPrayerStep
    | ScriptureStep
    | KeyVerseStep,
    Field(discriminator="kind"),
]


class ServicePlan(BaseModel):
    """One service, saved as backend/data/services/{id}.json."""

    id: str = Field(..., description="Filename stem, e.g. '2026-07-26'")
    label: str = Field(default="", description="Optional name, e.g. 'Christmas Eve'")
    service_title: str = ""
    steps: list[Step] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


PRAYER_TWO_BY_TWO = "Two by Two Prayer"
PRAYER_PERSONAL = "Personal Prayer"
PRAYER_REPRESENTATIVE = "Representative Prayer"


def default_steps() -> list[Step]:
    """The standard order — same as the old hardcoded service_builder flow."""
    return [
        TitleStep(),
        HymnStep(),
        HymnStep(),
        HymnStep(),
        PrayerStep(name=PRAYER_TWO_BY_TWO),
        CreedStep(),
        PrayerStep(name=PRAYER_PERSONAL),
        HymnStep(),
        PrayerStep(name=PRAYER_REPRESENTATIVE),
        TitleStep(),
        ScriptureStep(),
        KeyVerseStep(),
        LordsPrayerStep(),
    ]


def new_plan(plan_id: str, label: str = "") -> ServicePlan:
    return ServicePlan(id=plan_id, label=label, steps=default_steps())


def validate_plan(plan: ServicePlan) -> list[str]:
    """Return human-readable descriptions of what's still missing.

    Empty list means the plan is ready to compile. Steps that are merely
    unfilled are NOT errors on their own — an empty hymn slot is skipped
    silently, matching the old behaviour.
    """
    missing: list[str] = []

    if not plan.service_title.strip():
        missing.append("service title")

    for i, step in enumerate(plan.steps, start=1):
        where = f"step {i}"
        if step.kind == "prayer" and step.name == PRAYER_REPRESENTATIVE:
            if not step.led_by:
                missing.append(f"prayer leader ({where})")
        elif step.kind == "scripture" and step.ref is None:
            missing.append(f"Bible reading ({where})")
        elif step.kind == "key_verse" and step.ref is None:
            missing.append(f"key verse ({where})")

    return missing