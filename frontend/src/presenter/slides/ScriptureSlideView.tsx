import { inch, pt } from "../geometry";
import { useFitText } from "../useFitText";
import type { ScriptureSlide } from "../types/slides";

/**
 * A page of the Bible reading. Verses flow as continuous prose with bold
 * verse numbers, left-aligned and vertically centred.
 *
 * The non-breaking space after each number keeps it glued to the first word,
 * which is what the three-character "glue run" hack in app/slides/bible.py
 * was working around. The browser handles it properly.
 */
export function ScriptureSlideView({ slide }: { slide: ScriptureSlide }) {
  const { ref, fontSize } = useFitText(pt(28), pt(14), [slide.id]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        left: inch(0.4),
        top: inch(0.3),
        width: inch(12.53),
        height: inch(6.9),
        display: "flex",
        alignItems: "center",
        textAlign: "left",
        fontSize,
        lineHeight: 1.2,
        overflow: "hidden",
      }}
    >
      <div>
        {slide.verses.map((verse) => (
          <span key={verse.number}>
            <strong>{verse.number}</strong>
            {"\u00a0"}
            {verse.text}{" "}
          </span>
        ))}
      </div>
    </div>
  );
}