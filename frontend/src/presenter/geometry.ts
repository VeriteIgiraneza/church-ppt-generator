/**
 * Slide canvas geometry.
 *
 * Every slide is laid out at a fixed logical size and then scaled to fit
 * whatever window it's shown in. That means font sizes and positions are
 * absolute numbers you can reason about — no responsive guesswork — and
 * the control window's small preview is dimensionally identical to what
 * the projector shows.
 *
 * The canvas is 100px per inch, matching the pptx slide size
 * (13.33in x 7.5in in app/slides/base.py). So `inch(2)` here lands in the
 * same place as `Inches(2)` there, and `pt(40)` matches `Pt(40)`.
 */

export const SLIDE_W = 1333;
export const SLIDE_H = 750;
export const SLIDE_ASPECT = SLIDE_W / SLIDE_H;

const PX_PER_INCH = 100;
const PX_PER_PT = PX_PER_INCH / 72;

/** Convert points to canvas pixels. pt(40) === Pt(40) in the pptx. */
export const pt = (points: number): number => points * PX_PER_PT;

/** Convert inches to canvas pixels. inch(2) === Inches(2) in the pptx. */
export const inch = (inches: number): number => inches * PX_PER_INCH;

/** Matches FONT_NAME in app/slides/base.py. Both are system fonts — no CDN,
 *  which matters because this has to work with no internet. */
export const SLIDE_FONT = 'Georgia, "Times New Roman", serif';

export const SLIDE_INK = "#000000";
export const SLIDE_PAPER = "#ffffff";

/** Matches HYMN_UNDERLINE in app/slides/base.py. */
export const HYMN_UNDERLINE = "________________________________________________";