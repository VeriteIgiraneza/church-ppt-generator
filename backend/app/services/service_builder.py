"""Builds a complete church service presentation from a request.

Service order (hardcoded — same as the old app):
  1. Title slide
  2. Hymn 1
  3. Hymn 2
  4. Hymn 3
  5. Two by Two Prayer
  6. The Apostles' Creed
  7. Personal Prayer
  8. Hymn 4
  9. Representative Prayer (with leader name)
 10. Title slide (repeat)
 11. Bible reading
 12. Key verse
"""

from pathlib import Path

from fastapi import HTTPException

from app.data.repository import DataRepository
from app.models.service import BibleReference, GeneratePresentationRequest
from app.slides.bible import add_bible_reading_slides
from app.slides.builder import new_presentation, save_presentation
from app.slides.creed import add_creed_slides
from app.slides.hymn import add_hymn_slides
from app.slides.key_verse import add_key_verse_slide
from app.slides.prayer import add_prayer_slide
from app.slides.title import add_title_slide
from app.slides.lords_prayer import add_lords_prayer_slides

PRAYER_TWO_BY_TWO = "Two by Two Prayer"
PRAYER_PERSONAL = "Personal Prayer"
PRAYER_REPRESENTATIVE = "Representative Prayer"


def build_presentation(
    req: GeneratePresentationRequest,
    repo: DataRepository,
    filename: str,
) -> Path:
    """Build the full .pptx file and return the saved path."""
    # ----- Look up everything we need from the repo -----
    # Empty slots (None) are kept as None and skipped silently when rendering.
    hymns: list = []
    for hymn_id in req.hymn_ids:
        if hymn_id is None:
            hymns.append(None)
            continue
        hymn = next((h for h in repo.hymns if h.hymn_id == hymn_id), None)
        if hymn is None:
            raise HTTPException(status_code=404, detail=f"Hymn {hymn_id} not found")
        hymns.append(hymn)

    bible_verses = repo.get_bible_passage(
        req.bible_reading.book,
        req.bible_reading.chapter,
        req.bible_reading.start_verse,
        req.bible_reading.end_verse,
    )

    # Continue into the next chapter, if requested
    if (
        req.bible_reading.next_chapter is not None
        and req.bible_reading.next_start_verse is not None
        and req.bible_reading.next_end_verse is not None
    ):
        next_verses = repo.get_bible_passage(
            req.bible_reading.book,
            req.bible_reading.next_chapter,
            req.bible_reading.next_start_verse,
            req.bible_reading.next_end_verse,
        )
        bible_verses = bible_verses + next_verses

    if not bible_verses:
        raise HTTPException(
            status_code=404,
            detail=f"No verses found for {_format_reference(req.bible_reading)}",
        )

    key_verses = repo.get_bible_passage(
        req.key_verse.book,
        req.key_verse.chapter,
        req.key_verse.start_verse,
        req.key_verse.end_verse,
    )
    if not key_verses:
        raise HTTPException(
            status_code=404,
            detail=f"No verses found for key verse {_format_reference(req.key_verse)}",
        )

    creed = repo.get_creed_by_name(req.creed_name)
    if creed is None:
        raise HTTPException(
            status_code=404, detail=f"Creed '{req.creed_name}' not found"
        )

    # ----- Build the deck in the prescribed order -----
    prs = new_presentation()
    bible_ref_str = _format_reference(req.bible_reading)
    key_verse_ref_str = _format_reference(req.key_verse)

    add_title_slide(prs, req.service_title, bible_ref_str)
    if hymns[0] is not None:
        add_hymn_slides(prs, hymns[0])
    if hymns[1] is not None:
        add_hymn_slides(prs, hymns[1])
    if hymns[2] is not None:
        add_hymn_slides(prs, hymns[2])
    add_prayer_slide(prs, PRAYER_TWO_BY_TWO)
    add_creed_slides(prs, creed)
    add_prayer_slide(prs, PRAYER_PERSONAL)
    if hymns[3] is not None:
        add_hymn_slides(prs, hymns[3])
    add_prayer_slide(prs, PRAYER_REPRESENTATIVE, prayer_leader=req.prayer_leader)
    add_title_slide(prs, req.service_title, bible_ref_str)
    add_bible_reading_slides(prs, bible_verses)
    add_key_verse_slide(prs, key_verses, key_verse_ref_str)

    # Always close with The Lord's Prayer if it's loaded
    if repo.lords_prayer is not None:
        add_lords_prayer_slides(prs, repo.lords_prayer)

    return save_presentation(prs, filename)


def _format_reference(ref: BibleReference) -> str:
    """e.g. 'John 3:16', 'John 3:16-17', or 'John 3:30, 4:1-3'."""
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