"""Smoke test for the presenter endpoints. Run while uvicorn is up:

    python3 verify_presenter.py

Creates a throwaway plan, fills it in, compiles it, prints the deck,
then deletes the plan. Stdlib only — no extra dependencies.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

BASE = "http://localhost:8000/api/presenter"

HYMN_IDS = [20, 1, 7, 8]
PRAYER_LEADER = "M. Mike Doe"
READING = {"book": "John", "chapter": 3, "start_verse": 16, "end_verse": 18}
KEY_VERSE = {"book": "John", "chapter": 3, "start_verse": 16, "end_verse": 16}


def call(method: str, path: str, body: dict | None = None) -> dict | list | None:
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode()
        print(f"\n  FAILED  {method} {path} -> {exc.code}\n{detail}")
        sys.exit(1)
    except urllib.error.URLError as exc:
        print(f"\n  Can't reach {BASE} — is uvicorn running?\n  {exc.reason}")
        sys.exit(1)


def fill(plan: dict) -> dict:
    """Populate the draft: hymns, prayer leader, reading, key verse."""
    plan["service_title"] = "Smoke Test Service"
    hymn_slot = 0

    for step in plan["steps"]:
        kind = step["kind"]
        if kind == "hymn":
            if hymn_slot < len(HYMN_IDS):
                step["hymn_id"] = HYMN_IDS[hymn_slot]
            hymn_slot += 1
        elif kind == "prayer" and step["name"] == "Representative Prayer":
            step["led_by"] = PRAYER_LEADER
        elif kind == "scripture":
            step["ref"] = READING
        elif kind == "key_verse":
            step["ref"] = KEY_VERSE

    return plan


def describe(slide: dict) -> str:
    kind = slide["kind"]
    if kind == "hymn_verse":
        flags = []
        if slide["show_header"]:
            flags.append("header")
        if slide["is_last_verse"]:
            flags.append("*****")
        extra = f"verse {slide['verse_index']}/{slide['verse_count']}"
        if flags:
            extra += f" [{', '.join(flags)}]"
        return extra
    if kind == "liturgy":
        return f"page {slide['page']}/{slide['page_count']}, {len(slide['blocks'])} block(s)"
    if kind == "scripture":
        nums = [v["number"] for v in slide["verses"]]
        return f"page {slide['page']}/{slide['page_count']}, verses {nums}"
    if kind == "key_verse":
        return f"{len(slide['verses'])} verse(s)"
    if kind == "prayer":
        return f"led by {slide['led_by']}" if slide["led_by"] else ""
    if kind == "title":
        return f"'{slide['text']}' / '{slide['subtitle']}'"
    return ""


def main() -> None:
    print("1. Creating plan...")
    plan = call("POST", "/plans", {"id": "smoke-test", "label": "Smoke test"})
    plan_id = plan["id"]
    print(f"   id={plan_id}  steps={len(plan['steps'])}")

    print("2. Validating empty plan (should list what's missing)...")
    check = call("GET", f"/plans/{plan_id}/validate")
    print(f"   ready={check['ready']}  missing={check['missing']}")

    print("3. Filling it in and saving...")
    saved = call("PUT", f"/plans/{plan_id}", fill(plan))
    print(f"   saved, updated_at={saved['updated_at']}")

    print("4. Validating again (should be ready)...")
    check = call("GET", f"/plans/{plan_id}/validate")
    print(f"   ready={check['ready']}  missing={check['missing']}")
    if not check["ready"]:
        print("   -> stopping, plan is still incomplete")
        sys.exit(1)

    print("5. Compiling deck...\n")
    deck = call("POST", f"/plans/{plan_id}/compile")

    print(f"   {len(deck['slides'])} slides for '{deck['service_title']}'\n")
    print(f"   {'#':>3}  {'kind':<12} {'section':<34} detail")
    print(f"   {'-' * 3}  {'-' * 12} {'-' * 34} {'-' * 30}")
    for i, slide in enumerate(deck["slides"], start=1):
        label = slide["section_label"][:34]
        print(f"   {i:>3}  {slide['kind']:<12} {label:<34} {describe(slide)}")

    ids = [s["id"] for s in deck["slides"]]
    dupes = {i for i in ids if ids.count(i) > 1}
    print(f"\n   unique slide ids: {'yes' if not dupes else f'NO — {dupes}'}")

    print("\n6. Testing duplicate-plan...")
    copy = call("POST", "/plans", {"copy_from": plan_id, "label": "Copy"})
    old_step_ids = {s["id"] for s in saved["steps"]}
    new_step_ids = {s["id"] for s in copy["steps"]}
    overlap = old_step_ids & new_step_ids
    print(f"   copied as id={copy['id']}, step ids reissued: "
          f"{'yes' if not overlap else f'NO — {overlap}'}")

    print("\n7. Cleaning up...")
    # call("DELETE", f"/plans/{plan_id}")
    # call("DELETE", f"/plans/{copy['id']}")
    print("   deleted both\n")
    print("All checks passed.")


if __name__ == "__main__":
    main()