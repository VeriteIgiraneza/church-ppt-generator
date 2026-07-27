// Mirrors backend/app/presenter/models/session.py

export interface SessionState {
  plan_id: string | null;
  current_slide_id: string | null;
  /** 0-based; -1 when nothing is live. */
  index: number;
  total: number;
  blanked: boolean;
  deck_revision: number;
}

export type SessionCommand =
  | { type: "start"; plan_id: string }
  | { type: "end" }
  | { type: "next" }
  | { type: "prev" }
  | { type: "first" }
  | { type: "last" }
  | { type: "goto"; slide_id: string }
  | { type: "blank"; value: boolean }
  | { type: "get_deck" };