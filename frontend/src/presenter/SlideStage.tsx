import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { SLIDE_FONT, SLIDE_H, SLIDE_INK, SLIDE_PAPER, SLIDE_W } from "./geometry";

interface Props {
  children: ReactNode;
  /** Fills its parent when true (projector). Otherwise sized by the parent. */
  fill?: boolean;
  /** Colour of the letterbox bars around the slide. */
  matte?: string;
  /** Renders a black screen over the slide. The B key on the control view. */
  blanked?: boolean;
}

/**
 * Draws its children on a fixed SLIDE_W x SLIDE_H canvas, scaled to fit the
 * available space and letterboxed so the aspect ratio never distorts.
 *
 * Letterboxing rather than cropping matters for older 4:3 projectors: bars
 * are better than losing the bottom line of a hymn verse.
 */
export function SlideStage({
  children,
  fill = false,
  matte = "#000000",
  blanked = false,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const measure = () => {
      const { width, height } = wrapper.getBoundingClientRect();
      if (width > 0 && height > 0) {
        setScale(Math.min(width / SLIDE_W, height / SLIDE_H));
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: fill ? "absolute" : "relative",
        inset: fill ? 0 : undefined,
        width: "100%",
        height: fill ? "100%" : "100%",
        background: matte,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          flex: "0 0 auto",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          position: "relative",
          background: SLIDE_PAPER,
          color: SLIDE_INK,
          fontFamily: SLIDE_FONT,
          // Slides are authored, not reflowed — nothing here should be selectable
          // or draggable on a projector.
          userSelect: "none",
          visibility: scale > 0 ? "visible" : "hidden",
        }}
      >
        {children}
        {blanked && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#000000",
            }}
          />
        )}
      </div>
    </div>
  );
}