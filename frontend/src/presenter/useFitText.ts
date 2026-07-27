import { useLayoutEffect, useRef, useState } from "react";

/**
 * Shrinks font size until the content stops overflowing its container.
 *
 * This is the thing HTML does better than python-pptx. Instead of guessing
 * from character count (see hymn_verse_font_size in app/slides/base.py),
 * we render at the ideal size, measure the real overflow, and step down
 * only as far as necessary.
 *
 * The element you attach `ref` to must have a fixed height, otherwise it
 * grows to fit the text and never reports overflow.
 *
 * Usage:
 *   const { ref, fontSize } = useFitText(pt(44), pt(20), [slide.id]);
 *   <div ref={ref} style={{ height: 350, fontSize }}>...</div>
 */
export function useFitText(
  maxFontSize: number,
  minFontSize: number,
  deps: unknown[] = []
) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    let size = maxFontSize;
    el.style.fontSize = `${size}px`;

    // Step down in whole pixels. Cheap enough at these sizes, and avoids
    // the half-pixel jitter a binary search can settle on.
    const overflowing = () =>
      el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;

    while (size > minFontSize && overflowing()) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }

    setFontSize(size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxFontSize, minFontSize, ...deps]);

  return { ref, fontSize };
}