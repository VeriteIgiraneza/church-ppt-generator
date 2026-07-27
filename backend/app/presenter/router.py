"""HTTP endpoints for service plans and deck compilation."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from app.data.repository import DataRepository, get_repository
from app.presenter import plan_store
from app.presenter.compile import CompileError, compile_deck
from app.presenter.models.plan import ServicePlan, new_plan, validate_plan
from app.presenter.models.session import SessionState
from app.presenter import network
from app.presenter.models.slides import Deck
from app.presenter.session import session_manager

router = APIRouter(prefix="/api/presenter", tags=["presenter"])


class CreatePlanRequest(BaseModel):
    id: str | None = Field(
        default=None, description="Defaults to today's date, e.g. '2026-07-26'"
    )
    label: str = ""
    copy_from: str | None = Field(
        default=None,
        description="Existing plan id to duplicate (hymns, readings and all)",
    )


class ValidationResponse(BaseModel):
    ready: bool
    missing: list[str]


# ---------- plans ----------


@router.get("/plans", response_model=list[plan_store.PlanSummary])
def list_plans() -> list[plan_store.PlanSummary]:
    """All saved services, most recently updated first."""
    return plan_store.list_plans()


@router.post("/plans", response_model=ServicePlan, status_code=201)
def create_plan(req: CreatePlanRequest) -> ServicePlan:
    """Create a service — blank with the default order, or duplicated."""
    base_id = req.id or date.today().isoformat()

    try:
        plan_id = plan_store.next_available_id(base_id)

        if req.copy_from:
            source = plan_store.load_plan(req.copy_from)
            plan = source.model_copy(
                update={"id": plan_id, "label": req.label or source.label}
            )
            plan = _reissue_step_ids(plan)
        else:
            plan = new_plan(plan_id, req.label)

        return plan_store.save_plan(plan)
    except plan_store.PlanNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except plan_store.InvalidPlanId as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/plans/{plan_id}", response_model=ServicePlan)
def get_plan(plan_id: str) -> ServicePlan:
    return _load(plan_id)


@router.put("/plans/{plan_id}", response_model=ServicePlan)
def update_plan(plan_id: str, plan: ServicePlan) -> ServicePlan:
    """Replace a plan wholesale. The frontend sends the full edited plan."""
    if plan.id != plan_id:
        raise HTTPException(
            status_code=400,
            detail=f"Body id '{plan.id}' doesn't match URL id '{plan_id}'",
        )
    if not plan_store.plan_exists(plan_id):
        raise HTTPException(status_code=404, detail=f"Service '{plan_id}' not found")

    try:
        return plan_store.save_plan(plan)
    except plan_store.InvalidPlanId as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/plans/{plan_id}", status_code=204)
def delete_plan(plan_id: str) -> None:
    try:
        plan_store.delete_plan(plan_id)
    except plan_store.PlanNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except plan_store.InvalidPlanId as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


# ---------- validation + compilation ----------


@router.get("/plans/{plan_id}/validate", response_model=ValidationResponse)
def validate_saved_plan(plan_id: str) -> ValidationResponse:
    """What's still missing before this service can be presented."""
    missing = validate_plan(_load(plan_id))
    return ValidationResponse(ready=not missing, missing=missing)


@router.post("/plans/{plan_id}/compile", response_model=Deck)
def compile_saved_plan(
    plan_id: str,
    repo: DataRepository = Depends(get_repository),
) -> Deck:
    """Expand a saved plan into its flat slide list."""
    return _compile(_load(plan_id), repo)


@router.post("/compile", response_model=Deck)
def compile_unsaved_plan(
    plan: ServicePlan,
    repo: DataRepository = Depends(get_repository),
) -> Deck:
    """Compile a plan straight from the request body, without saving it.

    Used for live preview while the user is still editing.
    """
    return _compile(plan, repo)


# ---------- helpers ----------


def _load(plan_id: str) -> ServicePlan:
    try:
        return plan_store.load_plan(plan_id)
    except plan_store.PlanNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except plan_store.InvalidPlanId as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _compile(plan: ServicePlan, repo: DataRepository) -> Deck:
    try:
        return compile_deck(plan, repo)
    except CompileError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _reissue_step_ids(plan: ServicePlan) -> ServicePlan:
    """Give duplicated steps fresh ids.

    Slide ids derive from step ids, so a copied plan must not reuse them —
    otherwise two services could produce colliding slide ids and the session
    bus would jump to the wrong slide.
    """
    steps = [step.with_new_id() for step in plan.steps]
    return plan.model_copy(update={"steps": steps})

# ---------- live session ----------


@router.get("/session", response_model=SessionState)
def get_session() -> SessionState:
    """Plain HTTP snapshot of the live session. Handy for debugging."""
    return session_manager.snapshot()


@router.websocket("/session")
async def session_socket(
    websocket: WebSocket,
    repo: DataRepository = Depends(get_repository),
) -> None:
    """The bus every client speaks to.

    Inbound commands:
      {"type": "start",  "plan_id": "2026-07-26"}
      {"type": "next"} / {"type": "prev"}
      {"type": "first"} / {"type": "last"}
      {"type": "goto",  "slide_id": "a3f9c2e1-v3"}
      {"type": "blank", "value": true}
      {"type": "end"}
      {"type": "get_deck"}

    Outbound: a "deck" message when the deck changes, and a "state" snapshot
    after every command. Errors come back as {"type": "error", "detail": ...}
    to the sender only — one client's bad command shouldn't disturb the others.
    """
    await session_manager.connect(websocket)

    try:
        while True:
            message = await websocket.receive_json()
            command = message.get("type")

            try:
                if command == "start":
                    session_manager.start(message["plan_id"], repo)
                    await session_manager.broadcast_deck()
                elif command == "end":
                    session_manager.end()
                    await session_manager.broadcast_deck()
                elif command == "next":
                    session_manager.step(1)
                elif command == "prev":
                    session_manager.step(-1)
                elif command in ("first", "last"):
                    session_manager.jump(command)
                elif command == "goto":
                    session_manager.goto(message["slide_id"])
                elif command == "blank":
                    session_manager.set_blanked(bool(message.get("value", True)))
                elif command == "get_deck":
                    await session_manager.send_deck(websocket)
                    continue
                else:
                    await websocket.send_json(
                        {"type": "error", "detail": f"Unknown command '{command}'"}
                    )
                    continue
            except (CompileError, plan_store.PlanNotFound, KeyError) as exc:
                await websocket.send_json({"type": "error", "detail": str(exc)})
                continue

            await session_manager.broadcast_state()

    except WebSocketDisconnect:
        pass
    finally:
        await session_manager.disconnect(websocket)

class NetworkInfo(BaseModel):
    addresses: list[str]
    hostname: str


@router.get("/network", response_model=NetworkInfo)
def get_network() -> NetworkInfo:
    """Addresses the phone can reach this laptop on."""
    return NetworkInfo(
        addresses=network.local_addresses(),
        hostname=network.local_hostname(),
    )