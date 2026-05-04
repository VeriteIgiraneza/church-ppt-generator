# The Lord's Prayer — rendered with the same layout as creed

from pptx.presentation import Presentation

from app.models.creed import Creed
from app.models.lords_prayer import LordsPrayer
from app.slides.creed import add_creed_slides


def add_lords_prayer_slides(prs: Presentation, prayer: LordsPrayer) -> None:
    # Adapt to the Creed shape; same fields, same rendering.
    as_creed = Creed(
        creed_id=prayer.prayer_id,
        name=prayer.name,
        content=prayer.content,
    )
    add_creed_slides(prs, as_creed)