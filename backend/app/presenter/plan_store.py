"""Persistence for service plans — one JSON file per plan.

Files live in backend/data/services/{id}.json. A .bak copy is written
before every overwrite, matching the safety pattern used for hymns.csv.
Writes go to a temp file and are then atomically renamed, so a crash
mid-write can never leave a half-written plan on disk.
"""

from __future__ import annotations

import os
import re
import shutil
from datetime import datetime
from pathlib import Path

from pydantic import BaseModel

from app.core.config import settings
from app.presenter.models.plan import ServicePlan

# Plan ids become filenames, so they're strictly validated. Without this,
# an id like '../../data/hymns' would let a request write outside the
# services directory — and the phone remote is reachable over the network.
_VALID_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")


class PlanNotFound(Exception):
    """No plan with that id exists on disk."""


class InvalidPlanId(Exception):
    """The id contains characters that aren't safe in a filename."""


class PlanSummary(BaseModel):
    """Lightweight row for the 'open a service' list."""

    id: str
    label: str
    service_title: str
    step_count: int
    updated_at: datetime


def services_dir() -> Path:
    path = settings.data_dir / "services"
    path.mkdir(parents=True, exist_ok=True)
    return path


def _path_for(plan_id: str) -> Path:
    if not _VALID_ID.match(plan_id):
        raise InvalidPlanId(
            f"Invalid plan id '{plan_id}' — use letters, digits, dot, dash, underscore"
        )
    return services_dir() / f"{plan_id}.json"


def plan_exists(plan_id: str) -> bool:
    return _path_for(plan_id).exists()


def load_plan(plan_id: str) -> ServicePlan:
    path = _path_for(plan_id)
    if not path.exists():
        raise PlanNotFound(f"Service '{plan_id}' not found")
    return ServicePlan.model_validate_json(path.read_text(encoding="utf-8"))


def save_plan(plan: ServicePlan) -> ServicePlan:
    """Write the plan, backing up any existing file first. Bumps updated_at."""
    path = _path_for(plan.id)
    plan.updated_at = datetime.now()

    if path.exists():
        shutil.copy2(path, path.with_suffix(".json.bak"))

    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(
        plan.model_dump_json(indent=2, exclude_none=False), encoding="utf-8"
    )
    os.replace(tmp, path)  # atomic on the same filesystem

    return plan


def delete_plan(plan_id: str) -> None:
    path = _path_for(plan_id)
    if not path.exists():
        raise PlanNotFound(f"Service '{plan_id}' not found")
    shutil.copy2(path, path.with_suffix(".json.deleted"))
    path.unlink()


def list_plans() -> list[PlanSummary]:
    """All saved plans, most recently updated first. Skips unreadable files."""
    summaries: list[PlanSummary] = []

    for path in services_dir().glob("*.json"):
        try:
            plan = ServicePlan.model_validate_json(path.read_text(encoding="utf-8"))
        except Exception as exc:  # noqa: BLE001 — one bad file shouldn't break the list
            print(f"[presenter] Skipping unreadable plan {path.name}: {exc}")
            continue

        summaries.append(
            PlanSummary(
                id=plan.id,
                label=plan.label,
                service_title=plan.service_title,
                step_count=len(plan.steps),
                updated_at=plan.updated_at,
            )
        )

    summaries.sort(key=lambda s: s.updated_at, reverse=True)
    return summaries


def next_available_id(base: str) -> str:
    """'2026-07-26' -> '2026-07-26' if free, else '2026-07-26-2', '-3', ..."""
    if not plan_exists(base):
        return base
    for n in range(2, 100):
        candidate = f"{base}-{n}"
        if not plan_exists(candidate):
            return candidate
    raise InvalidPlanId(f"Too many services named '{base}'")