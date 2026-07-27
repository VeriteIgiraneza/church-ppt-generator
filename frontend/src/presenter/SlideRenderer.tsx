import { HymnVerseSlideView } from "./slides/HymnVerseSlideView";
import { KeyVerseSlideView } from "./slides/KeyVerseSlideView";
import { LiturgySlideView } from "./slides/LiturgySlideView";
import { PrayerSlideView } from "./slides/PrayerSlideView";
import { ScriptureSlideView } from "./slides/ScriptureSlideView";
import { TitleSlideView } from "./slides/TitleSlideView";
import type { Slide } from "./types/slides";

/**
 * Renders one slide's contents. Expects to be placed inside a SlideStage,
 * which supplies the canvas, the scaling, and the font.
 *
 * The switch is exhaustive: because Slide is a discriminated union, adding a
 * new slide kind to types/slides.ts makes TypeScript flag this file until you
 * handle it. That's deliberate — it's the compiler reminding you the projector
 * has no renderer for something the backend can now produce.
 */
export function SlideRenderer({ slide }: { slide: Slide }) {
  switch (slide.kind) {
    case "title":
      return <TitleSlideView slide={slide} />;
    case "hymn_verse":
      return <HymnVerseSlideView slide={slide} />;
    case "prayer":
      return <PrayerSlideView slide={slide} />;
    case "liturgy":
      return <LiturgySlideView slide={slide} />;
    case "scripture":
      return <ScriptureSlideView slide={slide} />;
    case "key_verse":
      return <KeyVerseSlideView slide={slide} />;
    default: {
      const exhaustive: never = slide;
      return exhaustive;
    }
  }
}