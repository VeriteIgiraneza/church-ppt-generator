import { inch, pt } from "../geometry";
import type { TitleSlide } from "../types/slides";

/** Service title + Bible reference, sitting in the lower third of the slide. */
export function TitleSlideView({ slide }: { slide: TitleSlide }) {
  return (
    <div
      style={{
        position: "absolute",
        left: inch(0.4),
        top: inch(4.9),
        width: inch(12.53),
        height: inch(2.2),
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: inch(0.2),
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: pt(45), fontWeight: 700, lineHeight: 1.2 }}>
        {slide.text}
      </div>
      {slide.subtitle && (
        <div style={{ fontSize: pt(40), lineHeight: 1.2 }}>{slide.subtitle}</div>
      )}
    </div>
  );
}