import { useCallback, useEffect, useState } from "react";
import { compilePlan, listPlans } from "./api";
import { SlideRenderer } from "./SlideRenderer";
import { SlideStage } from "./SlideStage";
import type { Deck } from "./types/slides";
import type { PlanSummary } from "./types/plan";

/**
 * A scratch harness for looking at compiled slides in a normal browser window.
 *
 * This is not the control view — no second display, no WebSocket, no remote.
 * Its only job is to let you check that every slide kind renders correctly
 * before any of that machinery exists.
 */
export function DeckPreview() {
  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [planId, setPlanId] = useState("");
  const [deck, setDeck] = useState<Deck | null>(null);
  const [index, setIndex] = useState(0);
  const [blanked, setBlanked] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listPlans()
      .then(setPlans)
      .catch((err) => setError(err.message));
  }, []);

  const load = useCallback(async (id: string) => {
    setError("");
    setDeck(null);
    setIndex(0);
    if (!id) return;
    try {
      setDeck(await compilePlan(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const total = deck?.slides.length ?? 0;

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => Math.min(Math.max(i + delta, 0), Math.max(total - 1, 0)));
    },
    [total]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLSelectElement) return;
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          go(1);
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          go(-1);
          break;
        case "Home":
          setIndex(0);
          break;
        case "End":
          setIndex(Math.max(total - 1, 0));
          break;
        case "b":
        case "B":
          setBlanked((v) => !v);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, total]);

  const slide = deck?.slides[index];

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#444" }}>
          Deck preview
        </h2>
        <select
          value={planId}
          onChange={(e) => {
            setPlanId(e.target.value);
            void load(e.target.value);
          }}
          style={{
            padding: "8px 12px",
            fontSize: "1rem",
            border: "2px solid #ddd",
            borderRadius: 6,
            background: "white",
          }}
        >
          <option value="">— choose a service —</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.label || plan.service_title || plan.id}
            </option>
          ))}
        </select>

        {deck && (
          <>
            <button onClick={() => go(-1)} disabled={index === 0} style={btn}>
              ‹ Prev
            </button>
            <button
              onClick={() => go(1)}
              disabled={index >= total - 1}
              style={btn}
            >
              Next ›
            </button>
            <span style={{ color: "#666" }}>
              {index + 1} of {total}
            </span>
            <button onClick={() => setBlanked((v) => !v)} style={btn}>
              {blanked ? "Unblank" : "Blank"}
            </button>
          </>
        )}
      </div>

      {error && (
        <p style={{ color: "crimson", marginBottom: 16 }}>⚠ {error}</p>
      )}

      {!deck && !error && (
        <p style={{ color: "#999", fontStyle: "italic" }}>
          Choose a saved service to compile it. Arrow keys move between slides,
          B blanks the screen.
        </p>
      )}

      {deck && slide && (
        <>
          <div style={{ height: 480, marginBottom: 12 }}>
            <SlideStage blanked={blanked}>
              <SlideRenderer slide={slide} />
            </SlideStage>
          </div>

          <div style={{ color: "#666", marginBottom: 16 }}>
            <strong>{slide.section_label}</strong>
            <span style={{ marginLeft: 8, color: "#999" }}>
              {slide.kind}
              {slide.kind === "hymn_verse" &&
                ` · verse ${slide.verse_index} of ${slide.verse_count}`}
              {(slide.kind === "liturgy" || slide.kind === "scripture") &&
                ` · page ${slide.page} of ${slide.page_count}`}
            </span>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {deck.slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setIndex(i)}
                title={s.section_label}
                style={{
                  width: 34,
                  height: 30,
                  fontSize: "0.75rem",
                  border: i === index ? "2px solid #2c7a2c" : "1px solid #ddd",
                  borderRadius: 4,
                  background: i === index ? "#e8f5e8" : "white",
                  cursor: "pointer",
                  color: "#444",
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: "6px 12px",
  fontSize: "0.9rem",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
  cursor: "pointer",
  color: "#444",
};