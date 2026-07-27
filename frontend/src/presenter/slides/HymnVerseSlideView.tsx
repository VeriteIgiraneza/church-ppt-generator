import { HYMN_UNDERLINE, inch, pt } from "../geometry";
import { useFitText } from "../useFitText";
import type { HymnVerseSlide } from "../types/slides";

/**
 * One hymn verse. The first verse also carries the hymn number and title.
 * The last verse carries the ***** marker that tells the congregation to sit.
 */
export function HymnVerseSlideView({ slide }: { slide: HymnVerseSlide }) {
  const { ref, fontSize } = useFitText(pt(44), pt(22), [slide.id]);

  return (
    <>
      {slide.show_header && (
        <div
          style={{
            position: "absolute",
            left: inch(1),
            top: inch(0.2),
            width: inch(11.33),
            textAlign: "center",
            fontSize: pt(40),
            fontWeight: 700,
            lineHeight: 1.1,
          }}
        >
          {slide.hymn_id} {slide.hymn_title}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: inch(2),
          top: slide.show_header ? inch(1.15) : inch(0.5),
          width: inch(9.33),
          textAlign: "center",
          fontSize: pt(30),
          lineHeight: 1,
          overflow: "hidden",
          whiteSpace: "nowrap",
        }}
      >
        {HYMN_UNDERLINE}
      </div>

      <div
        ref={ref}
        style={{
          position: "absolute",
          left: inch(1),
          top: slide.show_header ? inch(1.7) : inch(1.1),
          width: inch(11.33),
          height: slide.show_header ? inch(5.0) : inch(5.6),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontSize,
          lineHeight: 1.2,
          overflow: "hidden",
        }}
      >
        {slide.lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      {slide.is_last_verse && (
        <div
          style={{
            position: "absolute",
            left: 0,
            bottom: inch(0.3),
            width: "100%",
            textAlign: "center",
            fontSize: pt(30),
            letterSpacing: "0.1em",
          }}
        >
          *****
        </div>
      )}
    </>
  );
}