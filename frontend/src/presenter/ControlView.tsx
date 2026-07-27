import { useCallback, useEffect, useState } from "react";
import { listPlans } from "./api";
import { RemotePanel } from "./RemotePanel";
import { SlideRenderer } from "./SlideRenderer";
import { SlideStage } from "./SlideStage";
import { useSession } from "./useSession";
import type { PlanSummary } from "./types/plan";

/**
 * The operator's window. Shows what's live, what's next, and where you are
 * in the service — the things a person running a service actually needs that
 * the projector deliberately doesn't show.
 */
export function ControlView() {
  const {
    state,
    deck,
    currentSlide,
    nextSlide,
    connected,
    error,
    send,
    clearError,
  } = useSession();

  const [plans, setPlans] = useState<PlanSummary[]>([]);
  const [planId, setPlanId] = useState("");

  useEffect(() => {
    listPlans().then(setPlans).catch(() => setPlans([]));
  }, []);

  useEffect(() => {
    if (state?.plan_id) setPlanId(state.plan_id);
  }, [state?.plan_id]);

  const live = (state?.total ?? 0) > 0;

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLSelectElement) return;
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
        case " ":
          e.preventDefault();
          send({ type: "next" });
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          send({ type: "prev" });
          break;
        case "Home":
          send({ type: "first" });
          break;
        case "End":
          send({ type: "last" });
          break;
        case "b":
        case "B":
          send({ type: "blank", value: !(state?.blanked ?? false) });
          break;
      }
    },
    [send, state?.blanked]
  );

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  return (
    <div style={{ padding: 20, fontFamily: "system-ui, sans-serif" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.3rem" }}>Control</h1>

        <span
          title={connected ? "Connected to session" : "Reconnecting"}
          style={{
            padding: "3px 10px",
            borderRadius: 12,
            fontSize: "0.8rem",
            background: connected ? "#e8f5e8" : "#fdecea",
            color: connected ? "#2c7a2c" : "#b33",
          }}
        >
          {connected ? "connected" : "reconnecting…"}
        </span>

        <select
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          style={select}
        >
          <option value="">— choose a service —</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.label || plan.service_title || plan.id}
            </option>
          ))}
        </select>

        <button
          onClick={() => planId && send({ type: "start", plan_id: planId })}
          disabled={!planId || !connected}
          style={{ ...btn, fontWeight: 600 }}
        >
          {live ? "Restart" : "Start service"}
        </button>

        <button
          onClick={() => window.open("/?view=screen", "projector")}
          style={btn}
        >
          Open projector window
        </button>

        {live && (
          <button onClick={() => send({ type: "end" })} style={btn}>
            End
          </button>
        )}
      </div>

      {error && (
        <p style={{ color: "crimson", marginBottom: 12 }}>
          ⚠ {error}{" "}
          <button onClick={clearError} style={{ ...btn, padding: "2px 8px" }}>
            dismiss
          </button>
        </p>
      )}

      {!live && (
        <p style={{ color: "#999", fontStyle: "italic" }}>
          Choose a service and start it. Open the projector window on your second
          display, then drive with the arrow keys — B blanks the screen.
        </p>
      )}

      {live && (
        <>
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            <div style={{ flex: "1 1 65%", minWidth: 0 }}>
              <Caption>
                Live
                {state && (
                  <span style={{ color: "#999", fontWeight: 400 }}>
                    {" "}
                    · {state.index + 1} of {state.total}
                  </span>
                )}
              </Caption>
              <div style={{ height: 330 }}>
                <SlideStage blanked={state?.blanked ?? false}>
                  {currentSlide && <SlideRenderer slide={currentSlide} />}
                </SlideStage>
              </div>
              <div style={{ marginTop: 8, color: "#444" }}>
                <strong>{currentSlide?.section_label}</strong>
                {currentSlide?.kind === "hymn_verse" && (
                  <span style={{ color: "#888", marginLeft: 8 }}>
                    verse {currentSlide.verse_index} of{" "}
                    {currentSlide.verse_count}
                  </span>
                )}
                {(currentSlide?.kind === "scripture" ||
                  currentSlide?.kind === "liturgy") && (
                  <span style={{ color: "#888", marginLeft: 8 }}>
                    page {currentSlide.page} of {currentSlide.page_count}
                  </span>
                )}
              </div>
            </div>

            <div style={{ flex: "1 1 35%", minWidth: 0 }}>
              <Caption>Next</Caption>
              <div style={{ height: 180 }}>
                <SlideStage matte="#e8e8e8">
                  {nextSlide && <SlideRenderer slide={nextSlide} />}
                </SlideStage>
              </div>
              <div style={{ marginTop: 8, color: "#888", fontSize: "0.9rem" }}>
                {nextSlide ? nextSlide.section_label : "End of service"}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <button onClick={() => send({ type: "first" })} style={btn}>
              ⇤ First
            </button>
            <button onClick={() => send({ type: "prev" })} style={bigBtn}>
              ‹ Prev
            </button>
            <button onClick={() => send({ type: "next" })} style={bigBtn}>
              Next ›
            </button>
            <button onClick={() => send({ type: "last" })} style={btn}>
              Last ⇥
            </button>
            <button
              onClick={() =>
                send({ type: "blank", value: !(state?.blanked ?? false) })
              }
              style={{
                ...btn,
                background: state?.blanked ? "#333" : "white",
                color: state?.blanked ? "white" : "#444",
              }}
            >
              {state?.blanked ? "Unblank (B)" : "Blank (B)"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {deck?.slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => send({ type: "goto", slide_id: slide.id })}
                title={slide.section_label}
                style={{
                  width: 34,
                  height: 30,
                  fontSize: "0.75rem",
                  border:
                    i === state?.index ? "2px solid #2c7a2c" : "1px solid #ddd",
                  borderRadius: 4,
                  background: i === state?.index ? "#e8f5e8" : "white",
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

      <RemotePanel />
    </div>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "0.8rem",
        fontWeight: 600,
        color: "#666",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: 6,
      }}
    >
      {children}
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

const bigBtn: React.CSSProperties = {
  ...btn,
  padding: "12px 26px",
  fontSize: "1rem",
  fontWeight: 600,
};

const select: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: "1rem",
  border: "2px solid #ddd",
  borderRadius: 6,
  background: "white",
};