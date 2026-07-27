// Mirrors backend/app/presenter/models/plan.py

import type { BibleReference } from "../../types/service";

export const PRAYER_TWO_BY_TWO = "Two by Two Prayer";
export const PRAYER_PERSONAL = "Personal Prayer";
export const PRAYER_REPRESENTATIVE = "Representative Prayer";

interface StepBase {
  id: string;
}

export interface TitleStep extends StepBase {
  kind: "title";
}

export interface HymnStep extends StepBase {
  kind: "hymn";
  /** null means "not yet chosen" — the slot is skipped when compiling. */
  hymn_id: number | null;
}

export interface PrayerStep extends StepBase {
  kind: "prayer";
  name: string;
  led_by: string | null;
}

export interface CreedStep extends StepBase {
  kind: "creed";
  creed_name: string;
}

export interface LordsPrayerStep extends StepBase {
  kind: "lords_prayer";
}

export interface ScriptureStep extends StepBase {
  kind: "scripture";
  ref: BibleReference | null;
}

export interface KeyVerseStep extends StepBase {
  kind: "key_verse";
  ref: BibleReference | null;
}

export type Step =
  | TitleStep
  | HymnStep
  | PrayerStep
  | CreedStep
  | LordsPrayerStep
  | ScriptureStep
  | KeyVerseStep;

export interface ServicePlan {
  id: string;
  label: string;
  service_title: string;
  steps: Step[];
  created_at: string;
  updated_at: string;
}

export interface PlanSummary {
  id: string;
  label: string;
  service_title: string;
  step_count: number;
  updated_at: string;
}

export interface ValidationResponse {
  ready: boolean;
  missing: string[];
}

/** Human-readable name for a step, used in the plan editor list. */
export function stepLabel(step: Step): string {
  switch (step.kind) {
    case "title":
      return "Title slide";
    case "hymn":
      return "Hymn";
    case "prayer":
      return step.name;
    case "creed":
      return step.creed_name;
    case "lords_prayer":
      return "The Lord's Prayer";
    case "scripture":
      return "Bible reading";
    case "key_verse":
      return "Key verse";
  }
}