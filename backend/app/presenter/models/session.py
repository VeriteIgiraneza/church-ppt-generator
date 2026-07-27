"""What everyone watching a service needs to agree on."""

from __future__ import annotations

from pydantic import BaseModel, Field


class SessionState(BaseModel):
    """A snapshot of the live service.

    Broadcast to every connected client on every change. Snapshots rather
    than deltas: applying one is idempotent, and a client that reconnects
    mid-service gets the truth in one message instead of replaying history.
    """

    plan_id: str | None = None
    current_slide_id: str | None = None
    index: int = Field(default=-1, description="0-based; -1 when nothing is live")
    total: int = 0
    blanked: bool = False
    deck_revision: int = Field(
        default=0,
        description=(
            "Increments whenever the deck is recompiled. Clients cache the deck "
            "and refetch it when this changes."
        ),
    )