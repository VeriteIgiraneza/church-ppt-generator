import { useEffect } from "react";
import { useSession } from "./useSession";

/**
 * The phone remote. One more client of the session bus — it holds no state
 * and decides nothing, it just sends commands.
 *
 * Dark by design: this gets held in a dim sanctuary, and a white screen in
 * the third row is a distraction for everyone behind you. Targets are sized
 * for a thumb rather than a cursor, because a mis-tap during a service is
 * far more costly than a mis-click while editing.
 */
export function RemoteView() {
  const { state, currentSlide, nextSlide, connected, error, send } =
    useSession();

  useEffect(() => {
    document.title = "Remote";
    const previous = document.body.style.background;
    document.body.style.background = "#0f1116";
    return () => {
      document.body.style.background = previous;
    };
  }, []);

  const live = (state?.total ?? 0) > 0;
  const blanked = state?.blanked ?? false;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: "#0f1116",
        color: "#e8e8ea",
        fontFamily: "system-ui, sans-serif",
        padding: "16px 16px 24px",
        boxSizing: "border-box",
        // Stops double-tap zoom, which otherwise fires when you tap Next twice
        // in quick succession.
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        userSelect: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.85rem",
          color: "#8b8f9a",
          marginBottom: 20,
        }}
      >
        <span style={{ color: connected ? "#5fbf5f" : "#d97070" }}>
          {connected ? "● connected" : "● reconnecting…"}
        </span>
        {live && state && (
          <span>
            {state.index + 1} / {state.total}
          </span>
        )}
      </div>

      {error && (
        <p style={{ color: "#d97070", fontSize: "0.9rem", marginTop: 0 }}>
          {error}
        </p>
      )}

      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {!live ? (
          <p style={{ color: "#8b8f9a", lineHeight: 1.5 }}>
            No service running. Start one from the laptop, then drive it here.
          </p>
        ) : (
          <>
            <Label>Now</Label>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                lineHeight: 1.25,
                marginBottom: 6,
              }}
            >
              {currentSlide?.section_label ?? "—"}
            </div>
            <div style={{ color: "#8b8f9a", fontSize: "1rem" }}>
              {currentSlide?.kind === "hymn_verse" &&
                `Verse ${currentSlide.verse_index} of ${currentSlide.verse_count}`}
              {(currentSlide?.kind === "scripture" ||
                currentSlide?.kind === "liturgy") &&
                `Page ${currentSlide.page} of ${currentSlide.page_count}`}
              {currentSlide?.kind === "prayer" &&
                currentSlide.led_by &&
                `Led by ${currentSlide.led_by}`}
            </div>

            <div style={{ marginTop: 28 }}>
              <Label>Next</Label>
              <div style={{ fontSize: "1.1rem", color: "#b9bcc4" }}>
                {nextSlide?.section_label ?? "End of service"}
              </div>
            </div>
          </>
        )}
      </div>

      <button
        onClick={() => send({ type: "blank", value: !blanked })}
        disabled={!live}
        style={{
          padding: "14px",
          marginBottom: 12,
          fontSize: "1rem",
          borderRadius: 12,
          border: "1px solid #2a2d38",
          background: blanked ? "#e8e8ea" : "transparent",
          color: blanked ? "#0f1116" : "#b9bcc4",
          opacity: live ? 1 : 0.4,
        }}
      >
        {blanked ? "Show screen" : "Blank screen"}
      </button>

      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => send({ type: "prev" })}
          disabled={!live}
          style={{
            flex: "0 0 34%",
            padding: "26px 0",
            fontSize: "1.1rem",
            fontWeight: 600,
            borderRadius: 14,
            border: "1px solid #2a2d38",
            background: "#1a1d26",
            color: "#e8e8ea",
            opacity: live ? 1 : 0.4,
          }}
        >
          ‹ Back
        </button>
        <button
          onClick={() => send({ type: "next" })}
          disabled={!live}
          style={{
            flex: 1,
            padding: "26px 0",
            fontSize: "1.3rem",
            fontWeight: 700,
            borderRadius: 14,
            border: "none",
            background: "#2c7a2c",
            color: "white",
            opacity: live ? 1 : 0.4,
          }}
        >
          Next ›
        </button>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "0.7rem",
        fontWeight: 600,
        color: "#6b6f7a",
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}