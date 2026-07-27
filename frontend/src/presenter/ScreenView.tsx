import { useEffect } from "react";
import { SlideRenderer } from "./SlideRenderer";
import { SlideStage } from "./SlideStage";
import { useSession } from "./useSession";

/**
 * What the congregation sees. Nothing but the slide.
 *
 * Deliberately has no controls, no keyboard handling, and no state of its own:
 * it renders whatever the session says. That means it can be closed and
 * reopened mid-service and it comes back on the right slide, because the
 * position lives on the backend rather than in this window.
 */
export function ScreenView() {
  const { currentSlide, state, connected } = useSession();

  useEffect(() => {
    document.title = "Projector";
    const previous = document.body.style.background;
    document.body.style.background = "#000000";
    return () => {
      document.body.style.background = previous;
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000000",
        cursor: "none",
      }}
    >
      {currentSlide ? (
        <SlideStage fill blanked={state?.blanked ?? false}>
          <SlideRenderer slide={currentSlide} />
        </SlideStage>
      ) : (
        // Black, not a message — an idle projector should show nothing at all.
        // The only exception is a lost connection, which the operator needs
        // to know about, and this window may be the only one they can see.
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: connected ? "#1a1a1a" : "#4a2020",
            fontFamily: "system-ui, sans-serif",
            fontSize: 20,
          }}
        >
          {connected ? "" : "Reconnecting…"}
        </div>
      )}
    </div>
  );
}