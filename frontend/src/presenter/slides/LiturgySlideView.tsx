import { inch, pt } from "../geometry";
import { useFitText } from "../useFitText";
import type { LiturgySlide } from "../types/slides";

/**
 * The Apostles' Creed and The Lord's Prayer. Same layout for both — a
 * heading, then paragraph blocks with a blank line between them.
 *
 * The creed is one long block, so auto-fit does real work here.
 */
export function LiturgySlideView({ slide }: { slide: LiturgySlide }) {
  const { ref, fontSize } = useFitText(pt(30), pt(16), [slide.id]);

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: inch(0.1),
          top: inch(0.15),
          width: inch(13.13),
          textAlign: "center",
          fontSize: pt(46),
          fontWeight: 700,
          lineHeight: 1.1,
        }}
      >
        {slide.name}
      </div>

      <div
        ref={ref}
        style={{
          position: "absolute",
          left: inch(0.5),
          top: inch(1.25),
          width: inch(12.33),
          height: inch(5.9),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.7em",
          textAlign: "center",
          fontSize,
          lineHeight: 1.15,
          overflow: "hidden",
        }}
      >
        {slide.blocks.map((lines, blockIndex) => (
          <div key={blockIndex}>
            {lines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}