"""Compiles a ServicePlan into a flat Deck of slides.

This is the single place where:
  - '|' and '||' pipe strings get parsed into list[str]
  - Bible readings get paginated
  - Creed / Lord's Prayer paragraphs get grouped onto slides
  - Bible references get formatted for display

Both renderers (React SlideRenderer, .pptx exporter) consume the Deck this
produces. Nothing downstream re-parses or re-groups.
"""

from __future__ import annotations

from app.core.config import settings
from app.data.repository import DataRepository
from app.models.bible import BibleVerse
from app.models.service import BibleReference
from app.presenter.models.plan import (
    PRAYER_REPRESENTATIVE,
    ServicePlan,
    Step,
    validate_plan,
)
from app.presenter.models.slides import (
    Deck,
    HymnVerseSlide,
    KeyVerseSlide,
    LiturgySlide,
    NumberedVerse,
    PrayerSlide,
    ScriptureSlide,
    Slide,
    TitleSlide,
)

MAX_PARAGRAPHS_PER_LITURGY_SLIDE = 2


class CompileError(Exception):
    """Plan can't be compiled. The router turns this into an HTTP 400."""


def compile_deck(plan: ServicePlan, repo: DataRepository) -> Deck:
    """Expand every step in the plan into its slides, in order."""
    missing = validate_plan(plan)
    if missing:
        raise CompileError(f"Plan incomplete — still need: {', '.join(missing)}")

    # Title slides show the main reading as a subtitle. With reorderable steps
    # there could be several readings, so we use the first one in the plan.
    title_subtitle = _first_reading_reference(plan)

    slides: list[Slide] = []
    hymn_number = 0  # positional label among hymn steps, not the hymnal number

    for step in plan.steps:
        if step.kind == "title":
            slides.append(
                TitleSlide(
                    id=step.id,
                    section_id=step.id,
                    section_label="Title",
                    text=plan.service_title.strip(),
                    subtitle=title_subtitle,
                )
            )

        elif step.kind == "hymn":
            hymn_number += 1
            if step.hymn_id is None:
                continue  # empty slot — skipped silently, as before
            slides.extend(_hymn_slides(step, hymn_number, repo))

        elif step.kind == "prayer":
            slides.append(
                PrayerSlide(
                    id=step.id,
                    section_id=step.id,
                    section_label=step.name,
                    name=step.name,
                    led_by=(
                        step.led_by if step.name == PRAYER_REPRESENTATIVE else None
                    ),
                )
            )

        elif step.kind == "creed":
            creed = repo.get_creed_by_name(step.creed_name)
            if creed is None:
                raise CompileError(f"Creed '{step.creed_name}' not found")
            slides.extend(_liturgy_slides(step.id, creed.name, creed.content))

        elif step.kind == "lords_prayer":
            prayer = repo.lords_prayer
            if prayer is None:
                raise CompileError("The Lord's Prayer is not loaded")
            slides.extend(_liturgy_slides(step.id, prayer.name, prayer.content))

        elif step.kind == "scripture":
            slides.extend(_scripture_slides(step, repo))

        elif step.kind == "key_verse":
            slides.append(_key_verse_slide(step, repo))

    return Deck(
        plan_id=plan.id,
        service_title=plan.service_title.strip(),
        slides=slides,
    )


# ---------- step expanders ----------


def _hymn_slides(step: Step, hymn_number: int, repo: DataRepository) -> list[Slide]:
    hymn = next((h for h in repo.hymns if h.hymn_id == step.hymn_id), None)
    if hymn is None:
        raise CompileError(f"Hymn {step.hymn_id} not found")

    verses = _parse_blocks(hymn.verses)
    if not verses:
        raise CompileError(f"Hymn {hymn.hymn_id} has no verses")

    label = f"Hymn {hymn_number} — {hymn.hymn_id} {hymn.title}"
    count = len(verses)

    return [
        HymnVerseSlide(
            id=f"{step.id}-v{i}",
            section_id=step.id,
            section_label=label,
            hymn_id=hymn.hymn_id,
            hymn_title=hymn.title,
            lines=lines,
            verse_index=i,
            verse_count=count,
            show_header=(i == 1),
            is_last_verse=(i == count and count > 1),
        )
        for i, lines in enumerate(verses, start=1)
    ]


def _liturgy_slides(step_id: str, name: str, content: str) -> list[Slide]:
    paragraphs = _parse_blocks(content)
    if not paragraphs:
        raise CompileError(f"'{name}' has no content")

    pages = [
        paragraphs[i : i + MAX_PARAGRAPHS_PER_LITURGY_SLIDE]
        for i in range(0, len(paragraphs), MAX_PARAGRAPHS_PER_LITURGY_SLIDE)
    ]

    return [
        LiturgySlide(
            id=f"{step_id}-p{n}",
            section_id=step_id,
            section_label=name,
            name=name,
            blocks=page,
            page=n,
            page_count=len(pages),
        )
        for n, page in enumerate(pages, start=1)
    ]


def _scripture_slides(step: Step, repo: DataRepository) -> list[Slide]:
    verses = _fetch_passage(step.ref, repo)
    reference = _format_reference(step.ref)
    pages = _paginate_verses(verses, settings.max_chars_per_bible_slide)
    label = f"Reading — {reference}"

    return [
        ScriptureSlide(
            id=f"{step.id}-p{n}",
            section_id=step.id,
            section_label=label,
            reference=reference,
            verses=page,
            page=n,
            page_count=len(pages),
        )
        for n, page in enumerate(pages, start=1)
    ]


def _key_verse_slide(step: Step, repo: DataRepository) -> Slide:
    verses = _fetch_passage(step.ref, repo)
    reference = _format_reference(step.ref)

    return KeyVerseSlide(
        id=step.id,
        section_id=step.id,
        section_label=f"Key verse — {reference}",
        reference=reference,
        verses=[NumberedVerse(number=v.verse, text=v.text) for v in verses],
    )


# ---------- helpers ----------


def _parse_blocks(raw: str) -> list[list[str]]:
    """'a|b||c|d' -> [['a','b'], ['c','d']]. Drops empty lines and blocks."""
    blocks: list[list[str]] = []
    for block in raw.split("||"):
        lines = [line.strip() for line in block.split("|")]
        lines = [line for line in lines if line]
        if lines:
            blocks.append(lines)
    return blocks


def _fetch_passage(ref: BibleReference, repo: DataRepository) -> list[BibleVerse]:
    """Look up a reference, including its optional next-chapter continuation."""
    verses = repo.get_bible_passage(
        ref.book, ref.chapter, ref.start_verse, ref.end_verse
    )

    if (
        ref.next_chapter is not None
        and ref.next_start_verse is not None
        and ref.next_end_verse is not None
    ):
        verses = verses + repo.get_bible_passage(
            ref.book, ref.next_chapter, ref.next_start_verse, ref.next_end_verse
        )

    if not verses:
        raise CompileError(f"No verses found for {_format_reference(ref)}")
    return verses


def _paginate_verses(
    verses: list[BibleVerse], max_chars: int
) -> list[list[NumberedVerse]]:
    """Group verses into pages by character count. Never splits a verse.

    The React renderer may re-split these pages after measuring real overflow;
    this is the estimate the .pptx export uses as-is.
    """
    pages: list[list[NumberedVerse]] = []
    page: list[NumberedVerse] = []
    page_chars = 0

    for verse in verses:
        cost = len(f"{verse.verse} {verse.text} ")
        if page and page_chars + cost > max_chars:
            pages.append(page)
            page = []
            page_chars = 0
        page.append(NumberedVerse(number=verse.verse, text=verse.text))
        page_chars += cost

    if page:
        pages.append(page)
    return pages or [[]]


def _first_reading_reference(plan: ServicePlan) -> str:
    for step in plan.steps:
        if step.kind == "scripture" and step.ref is not None:
            return _format_reference(step.ref)
    return ""


def _format_reference(ref: BibleReference) -> str:
    """'John 3:16', 'John 3:16-17', or 'John 3:30, 4:1-3'."""
    if ref.start_verse == ref.end_verse:
        first = f"{ref.book} {ref.chapter}:{ref.start_verse}"
    else:
        first = f"{ref.book} {ref.chapter}:{ref.start_verse}-{ref.end_verse}"

    if ref.next_chapter is None:
        return first

    if ref.next_start_verse == ref.next_end_verse:
        second = f"{ref.next_chapter}:{ref.next_start_verse}"
    else:
        second = f"{ref.next_chapter}:{ref.next_start_verse}-{ref.next_end_verse}"

    return f"{first}, {second}"