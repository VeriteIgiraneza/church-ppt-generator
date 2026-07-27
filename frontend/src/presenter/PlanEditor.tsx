import { useCallback, useEffect, useState } from "react";
import {
  compileDraft,
  createPlan,
  deletePlan,
  getPlan,
  listPlans,
  savePlan,
} from "./api";
import { allowedRangesFor, firstReading, newStepId } from "./format";
import { StepEditor } from "./StepEditor";
import {
  PRAYER_PERSONAL,
  PRAYER_REPRESENTATIVE,
  PRAYER_TWO_BY_TWO,
  stepLabel,
} from "./types/plan";
import type { PlanSummary, ServicePlan, Step } from "./types/plan";

type AddOption = { label: string; make: () => Step };

const ADD_OPTIONS: AddOption[] = [
  { label: "Title slide", make: () => ({ id: newStepId(), kind: "title" }) },
  { label: "Hymn", make: () => ({ id: newStepId(), kind: "hymn", hymn_id: null }) },
  {
    label: PRAYER_TWO_BY_TWO,
    make: () => ({
      id: newStepId(),
      kind: "prayer",
      name: PRAYER_TWO_BY_TWO,
      led_by: null,
    }),
  },
  {
    label: PRAYER_PERSONAL,
    make: () => ({
      id: newStepId(),
      kind: "prayer",
      name: PRAYER_PERSONAL,
      led_by: null,
    }),
  },
  {
    label: PRAYER_REPRESENTATIVE,
    make: () => ({
      id: newStepId(),
      kind: "prayer",
      name: PRAYER_REPRESENTATIVE,
      led_by: null,
    }),
  },
  {
    label: "The Apostles' Creed",
    make: () => ({
      id: newStepId(),
      kind: "creed",
      creed_name: "The Apostles' Creed",
    }),
  },
  {
    label: "Bible reading",
    make: () => ({ id: newStepId(), kind: "scripture", ref: null }),
  },
  {
    label: "Key verse",
    make: () => ({ id: newStepId(), kind: "key_verse", ref: null }),
  },
  {
    label: "The Lord's Prayer",
    make: () => ({ id: newStepId(), kind: "lords_prayer" }),
  },
];

export function PlanEditor() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const refreshPlans = useCallback(async () => {
    try {
      setPlans(await listPlans());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    void refreshPlans();
  }, [refreshPlans]);

  // Warn before losing unsaved edits. Saving is explicit rather than automatic
  // so that the .bak file plan_store writes stays a useful undo point.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function edit(next: ServicePlan) {
    setPlan(next);
    setDirty(true);
    setStatus("");
  }

  async function run<T>(work: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setError("");
    try {
      return await work();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  async function open(planId: string) {
    if (!planId) {
      setPlan(null);
      return;
    }
    const loaded = await run(() => getPlan(planId));
    if (loaded) {
      setPlan(loaded);
      setDirty(false);
      setStatus("");
    }
  }

  async function create(copyFrom?: string) {
    const created = await run(() =>
      createPlan(copyFrom ? { copy_from: copyFrom } : {})
    );
    if (created) {
      setPlan(created);
      setDirty(false);
      setStatus(copyFrom ? "Duplicated" : "Created");
      void refreshPlans();
    }
  }

  async function save() {
    if (!plan) return;
    const saved = await run(() => savePlan(plan));
    if (saved) {
      setPlan(saved);
      setDirty(false);
      setStatus("Saved");
      void refreshPlans();
    }
  }

  async function remove() {
    if (!plan) return;
    const saved = await run(() => deletePlan(plan.id));
    if (saved !== undefined) {
      setPlan(null);
      setDirty(false);
      void refreshPlans();
    }
  }

  /** Compiles without saving, so the backend is the only judge of readiness. */
  async function check() {
    if (!plan) return;
    const deck = await run(() => compileDraft(plan));
    if (deck) setStatus(`Ready — ${deck.slides.length} slides`);
  }

  function move(index: number, delta: number) {
    if (!plan) return;
    const target = index + delta;
    if (target < 0 || target >= plan.steps.length) return;
    const steps = [...plan.steps];
    [steps[index], steps[target]] = [steps[target], steps[index]];
    edit({ ...plan, steps });
  }

  function removeStep(index: number) {
    if (!plan) return;
    edit({ ...plan, steps: plan.steps.filter((_, i) => i !== index) });
  }

  function addStep(option: AddOption) {
    if (!plan) return;
    edit({ ...plan, steps: [...plan.steps, option.make()] });
  }

  function patchStep(id: string, patch: Record<string, unknown>) {
    if (!plan) return;
    edit({
      ...plan,
      steps: plan.steps.map((step) =>
        step.id === id ? ({ ...step, ...patch } as Step) : step
      ),
    });
  }

  const reading = plan ? firstReading(plan) : null;
  const keyVerseRanges = reading ? allowedRangesFor(reading) : undefined;

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 860,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ margin: "0 0 16px", fontSize: "1.6rem" }}>Service plan</h1>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <select
          value={plan?.id ?? ""}
          onChange={(e) => void open(e.target.value)}
          style={select}
        >
          <option value="">— open a service —</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label || p.service_title || p.id}
            </option>
          ))}
        </select>

        <button onClick={() => void create()} style={btn} disabled={busy}>
          New
        </button>
        {plan && (
          <button
            onClick={() => void create(plan.id)}
            style={btn}
            disabled={busy || dirty}
            title={dirty ? "Save first" : "Copy this service, hymns and all"}
          >
            Duplicate
          </button>
        )}
      </div>

      {error && <p style={{ color: "crimson" }}>⚠ {error}</p>}

      {!plan && !error && (
        <p style={{ color: "#999", fontStyle: "italic" }}>
          Open a saved service, or create a new one with the standard order.
        </p>
      )}

      {plan && (
        <>
          <section style={{ marginBottom: 20 }}>
            <label style={label}>Service title</label>
            <input
              type="text"
              value={plan.service_title}
              onChange={(e) => edit({ ...plan, service_title: e.target.value })}
              placeholder="e.g., Sunday Morning Worship"
              style={{ ...input, marginBottom: 12 }}
            />
            <label style={label}>Name (optional)</label>
            <input
              type="text"
              value={plan.label}
              onChange={(e) => edit({ ...plan, label: e.target.value })}
              placeholder="e.g., Christmas Eve"
              style={input}
            />
          </section>

          <section style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: "1.1rem", color: "#666" }}>
              Steps
              <span
                style={{
                  fontWeight: "normal",
                  color: "#999",
                  marginLeft: 8,
                  fontSize: "0.85rem",
                }}
              >
                {plan.steps.length} in order
              </span>
            </h2>

            {plan.steps.map((step, index) => (
              <div
                key={step.id}
                style={{
                  padding: "14px 16px",
                  marginBottom: 10,
                  border: "1px solid #e0e0e0",
                  borderRadius: 8,
                  background: "white",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                    gap: 8,
                  }}
                >
                  <strong style={{ color: "#222" }}>
                    <span style={{ color: "#bbb", marginRight: 8 }}>
                      {index + 1}
                    </span>
                    {stepLabel(step)}
                  </strong>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      style={iconBtn}
                      title="Move up"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(index, 1)}
                      disabled={index === plan.steps.length - 1}
                      style={iconBtn}
                      title="Move down"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => removeStep(index)}
                      style={{ ...iconBtn, color: "#b33" }}
                      title="Remove step"
                      aria-label="Remove step"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <StepEditor
                  step={step}
                  onChange={(patch) => patchStep(step.id, patch)}
                  reading={reading}
                  keyVerseRanges={keyVerseRanges}
                />
              </div>
            ))}

            <select
              value=""
              onChange={(e) => {
                const option = ADD_OPTIONS[Number(e.target.value)];
                if (option) addStep(option);
              }}
              style={{ ...select, marginTop: 4 }}
            >
              <option value="">+ Add step</option>
              {ADD_OPTIONS.map((option, i) => (
                <option key={option.label} value={i}>
                  {option.label}
                </option>
              ))}
            </select>
          </section>

          <section
            style={{
              paddingTop: 16,
              borderTop: "2px solid #eee",
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => void save()}
              disabled={busy || !dirty}
              style={{
                ...btn,
                fontWeight: 600,
                color: "white",
                background: busy || !dirty ? "#aaa" : "#2c7a2c",
                border: "none",
                cursor: busy || !dirty ? "not-allowed" : "pointer",
              }}
            >
              {busy ? "Working…" : dirty ? "Save" : "Saved"}
            </button>
            <button onClick={() => void check()} style={btn} disabled={busy}>
              Check
            </button>
            <a
              href={`/?view=preview`}
              style={{ ...btn, textDecoration: "none", lineHeight: "1.6" }}
            >
              Preview
            </a>
            <button
              onClick={() => void remove()}
              style={{ ...btn, color: "#b33" }}
              disabled={busy}
            >
              Delete
            </button>

            {dirty && <span style={{ color: "#b58900" }}>Unsaved changes</span>}
            {status && <span style={{ color: "#2c7a2c" }}>{status}</span>}
          </section>
        </>
      )}
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: "8px 14px",
  fontSize: "0.9rem",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
  cursor: "pointer",
  color: "#444",
};

const iconBtn: React.CSSProperties = {
  width: 30,
  height: 28,
  fontSize: "0.95rem",
  border: "1px solid #ddd",
  borderRadius: 4,
  background: "white",
  cursor: "pointer",
  color: "#444",
};

const select: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: "1rem",
  border: "2px solid #ddd",
  borderRadius: 6,
  background: "white",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  fontSize: "1rem",
  border: "2px solid #ddd",
  borderRadius: 6,
  boxSizing: "border-box",
};

const label: React.CSSProperties = {
  display: "block",
  marginBottom: 4,
  fontSize: "0.9rem",
  color: "#444",
  fontWeight: 600,
};