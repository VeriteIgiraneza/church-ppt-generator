"""Shared constants and helpers for slide rendering."""

from pptx.dml.color import RGBColor
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.text.text import TextFrame
from pptx.util import Inches, Pt

# ----- canvas -----
SLIDE_WIDTH = Inches(13.33)
SLIDE_HEIGHT = Inches(7.5)
BLANK_LAYOUT_INDEX = 6

# ----- typography -----
FONT_NAME = "Georgia"
BLACK = RGBColor(0, 0, 0)

# Reusable shorthand
ALIGN_CENTER = PP_ALIGN.CENTER
ALIGN_LEFT = PP_ALIGN.LEFT
ANCHOR_MIDDLE = MSO_ANCHOR.MIDDLE
ANCHOR_TOP = MSO_ANCHOR.TOP


def hymn_verse_font_size(text_length: int) -> Pt:
    """Pick a font size based on verse length (longer text → smaller font)."""
    if text_length < 100:
        return Pt(44)
    elif text_length < 30:
        return Pt(42)
    else:
        return Pt(40)


def add_centered_paragraph(
    text_frame: TextFrame,
    text: str,
    font_size: Pt,
    *,
    bold: bool = False,
    line_spacing: float = 1.2,
) -> None:
    """Add a paragraph centered horizontally, with our standard font + color."""
    p = text_frame.add_paragraph()
    p.text = text
    p.alignment = ALIGN_CENTER
    p.font.size = font_size
    p.font.name = FONT_NAME
    p.font.bold = bold
    p.font.color.rgb = BLACK
    p.line_spacing = line_spacing


# Underline used between hymn title and verse content
HYMN_UNDERLINE = "________________________________________________"