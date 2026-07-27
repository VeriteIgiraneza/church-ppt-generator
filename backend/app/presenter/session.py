"""The live session — one running service, shared by every connected client.

There is exactly one of these per backend process, because there is exactly
one projector. The control window, the projector window, and the phone remote
are all just clients of it: none of them holds authoritative state, and none
of them decides what "next slide" means. That's what keeps three windows on
two devices from ever drifting apart.
"""

from __future__ import annotations

import asyncio

from fastapi import WebSocket

from app.data.repository import DataRepository
from app.presenter.compile import compile_deck
from app.presenter.models.session import SessionState
from app.presenter.models.slides import Deck
from app.presenter.plan_store import load_plan


class SessionManager:
    def __init__(self) -> None:
        self._deck: Deck | None = None
        self._deck_revision = 0
        self._current_slide_id: str | None = None
        self._blanked = False
        self._clients: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    # ---------- state ----------

    @property
    def deck(self) -> Deck | None:
        return self._deck

    @property
    def deck_revision(self) -> int:
        return self._deck_revision

    def snapshot(self) -> SessionState:
        slides = self._deck.slides if self._deck else []
        index = -1
        if self._current_slide_id is not None:
            for i, slide in enumerate(slides):
                if slide.id == self._current_slide_id:
                    index = i
                    break

        return SessionState(
            plan_id=self._deck.plan_id if self._deck else None,
            current_slide_id=self._current_slide_id,
            index=index,
            total=len(slides),
            blanked=self._blanked,
            deck_revision=self._deck_revision,
        )

    # ---------- commands ----------

    def start(self, plan_id: str, repo: DataRepository) -> None:
        """Compile a plan and make it live, positioned on the first slide."""
        plan = load_plan(plan_id)
        self._deck = compile_deck(plan, repo)
        self._deck_revision += 1
        self._blanked = False
        self._current_slide_id = (
            self._deck.slides[0].id if self._deck.slides else None
        )

    def end(self) -> None:
        self._deck = None
        self._deck_revision += 1
        self._current_slide_id = None
        self._blanked = False

    def goto(self, slide_id: str) -> None:
        if self._deck and self._deck.index_of(slide_id) is not None:
            self._current_slide_id = slide_id

    def step(self, delta: int) -> None:
        """Move by delta, clamped at both ends.

        Clamped rather than wrapping: running off the end of the deck and
        landing back on the title slide mid-service would be alarming.
        """
        if not self._deck or not self._deck.slides:
            return

        current = self.snapshot().index
        if current < 0:
            current = 0 if delta > 0 else len(self._deck.slides) - 1
        else:
            current += delta

        current = max(0, min(current, len(self._deck.slides) - 1))
        self._current_slide_id = self._deck.slides[current].id

    def jump(self, where: str) -> None:
        if not self._deck or not self._deck.slides:
            return
        target = self._deck.slides[0 if where == "first" else -1]
        self._current_slide_id = target.id

    def set_blanked(self, value: bool) -> None:
        self._blanked = value

    # ---------- connections ----------

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._clients.add(websocket)
        await self.send_deck(websocket)
        await self.send_state(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._clients.discard(websocket)

    async def send_deck(self, websocket: WebSocket) -> None:
        await websocket.send_json(
            {
                "type": "deck",
                "deck_revision": self._deck_revision,
                "deck": self._deck.model_dump() if self._deck else None,
            }
        )

    async def send_state(self, websocket: WebSocket) -> None:
        await websocket.send_json(
            {"type": "state", **self.snapshot().model_dump()}
        )

    async def broadcast_state(self) -> None:
        message = {"type": "state", **self.snapshot().model_dump()}
        await self._broadcast(message)

    async def broadcast_deck(self) -> None:
        message = {
            "type": "deck",
            "deck_revision": self._deck_revision,
            "deck": self._deck.model_dump() if self._deck else None,
        }
        await self._broadcast(message)

    async def _broadcast(self, message: dict) -> None:
        # Iterate a copy: a send can fail and remove a client mid-loop.
        async with self._lock:
            clients = list(self._clients)

        dead: list[WebSocket] = []
        for client in clients:
            try:
                await client.send_json(message)
            except Exception:  # noqa: BLE001 — a dropped client must not break the rest
                dead.append(client)

        if dead:
            async with self._lock:
                for client in dead:
                    self._clients.discard(client)


# Singleton — one projector, one session.
session_manager = SessionManager()