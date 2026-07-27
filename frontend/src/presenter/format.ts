import type { BibleReference } from "../types/service";
import type { AllowedRange } from "../features/bible/BibleSelector";
import type { ServicePlan } from "./types/plan";

/**
 * "John 3:16", "John 3:16-17", or "John 3:30, 4:1-3".
 *
 * Mirrors _format_reference in app/presenter/compile.py. Keep the two in
 * step so the editor shows exactly what lands on the slide.
 */
export function formatReference(ref: BibleReference): string {
  const first =
    ref.start_verse === ref.end_verse
      ? `${ref.book} ${ref.chapter}:${ref.start_verse}`
      : `${ref.book} ${ref.chapter}:${ref.start_verse}-${ref.end_verse}`;

  if (ref.next_chapter === undefined) return first;

  const second =
    ref.next_start_verse === ref.next_end_verse
      ? `${ref.next_chapter}:${ref.next_start_verse}`
      : `${ref.next_chapter}:${ref.next_start_verse}-${ref.next_end_verse}`;

  return `${first}, ${second}`;
}

/** The chapter ranges a key verse may be picked from, given a reading. */
export function allowedRangesFor(ref: BibleReference): AllowedRange[] {
  const ranges: AllowedRange[] = [
    {
      chapter: ref.chapter,
      start_verse: ref.start_verse,
      end_verse: ref.end_verse,
    },
  ];

  if (
    ref.next_chapter !== undefined &&
    ref.next_start_verse !== undefined &&
    ref.next_end_verse !== undefined
  ) {
    ranges.push({
      chapter: ref.next_chapter,
      start_verse: ref.next_start_verse,
      end_verse: ref.next_end_verse,
    });
  }

  return ranges;
}

/**
 * The first Bible reading in the plan that actually has a reference.
 * Same rule the backend uses to pick the title slide's subtitle, and the
 * same one that constrains the key verse picker.
 */
export function firstReading(plan: ServicePlan): BibleReference | null {
  for (const step of plan.steps) {
    if (step.kind === "scripture" && step.ref) return step.ref;
  }
  return null;
}

/**
 * Short id for a newly added step, matching the backend's uuid4().hex[:8].
 *
 * crypto.randomUUID needs a secure context, and the phone reaches this app
 * over plain http on the LAN — so there's a fallback.
 */
export function newStepId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  }
  return Math.random().toString(16).slice(2, 10).padEnd(8, "0");
}