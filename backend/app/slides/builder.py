"""Builds a complete .pptx from a service definition.

Owns the actual `Presentation` object and delegates per-slide rendering
to the slides/ submodules.
"""

from pathlib import Path

from pptx import Presentation as PresentationFactory
from pptx.presentation import Presentation

from app.core.config import settings
from app.slides.base import SLIDE_HEIGHT, SLIDE_WIDTH


def new_presentation() -> Presentation:
    """Create a fresh Presentation, using the church template if it exists."""
    if settings.template_file.exists():
        prs = PresentationFactory(str(settings.template_file))
        # Strip any default slides from the template
        _remove_existing_slides(prs)
    else:
        prs = PresentationFactory()

    prs.slide_width = SLIDE_WIDTH
    prs.slide_height = SLIDE_HEIGHT
    return prs


def save_presentation(prs: Presentation, filename: str) -> Path:
    """Save the presentation into backend/output/ and return the path."""
    settings.output_dir.mkdir(parents=True, exist_ok=True)
    out_path = settings.output_dir / filename
    prs.save(str(out_path))
    return out_path


def _remove_existing_slides(prs: Presentation) -> None:
    """Remove any pre-existing slides from a template-based presentation."""
    sldIdLst = prs.slides._sldIdLst
    for i in range(len(sldIdLst) - 1, -1, -1):
        rId = sldIdLst[i].rId
        prs.part.drop_rel(rId)
        del sldIdLst[i]