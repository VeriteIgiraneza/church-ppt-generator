import { inch, pt } from "../geometry";
import type { PrayerSlide } from "../types/slides";

/** Prayer name, centred. Representative Prayer also names who leads it. */
export function PrayerSlideView({ slide }: { slide: PrayerSlide }) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: inch(0.5),
          top: inch(2),
          width: inch(12.33),
          height: inch(2),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontSize: pt(48),
          fontWeight: 700,
          lineHeight: 1.2,
        }}
      >
        {slide.name}
      </div>

      {slide.led_by && (
        <div
          style={{
            position: "absolute",
            left: inch(0.5),
            top: inch(4.5),
            width: inch(12.33),
            height: inch(1.5),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            fontSize: pt(28),
            lineHeight: 1.2,
          }}
        >
          Led by: {slide.led_by}
        </div>
      )}
    </>
  );
}