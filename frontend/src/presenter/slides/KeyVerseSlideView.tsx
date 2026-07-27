import { inch, pt } from "../geometry";
import { useFitText } from "../useFitText";
import type { KeyVerseSlide } from "../types/slides";

/** The key verse, quoted and centred under a "KEY VERSE" heading. */
export function KeyVerseSlideView({ slide }: { slide: KeyVerseSlide }) {
  const { ref, fontSize } = useFitText(pt(34), pt(18), [slide.id]);

  const quoted = slide.verses
    .map((verse) => `${verse.number} ${verse.text}`)
    .join(" ");

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: inch(0.1),
          top: inch(0.6),
          width: inch(13.13),
          textAlign: "center",
          fontSize: pt(40),
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        KEY VERSE: {slide.reference}
      </div>

      <div
        ref={ref}
        style={{
          position: "absolute",
          left: inch(1),
          top: inch(2),
          width: inch(11.33),
          height: inch(4.2),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontSize,
          lineHeight: 1.3,
          overflow: "hidden",
        }}
      >
        <div>&ldquo;{quoted}&rdquo;</div>
      </div>
    </>
  );
}