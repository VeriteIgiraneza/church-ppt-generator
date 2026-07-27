// Mirrors backend/app/presenter/models/slides.py
// If you change the Pydantic models, change this too.

export interface NumberedVerse {
  number: number;
  text: string;
}

interface SlideBase {
  id: string;
  section_id: string;
  section_label: string;
}

export interface TitleSlide extends SlideBase {
  kind: "title";
  text: string;
  subtitle: string;
}

export interface HymnVerseSlide extends SlideBase {
  kind: "hymn_verse";
  hymn_id: number;
  hymn_title: string;
  lines: string[];
  verse_index: number;
  verse_count: number;
  show_header: boolean;
  is_last_verse: boolean;
}

export interface PrayerSlide extends SlideBase {
  kind: "prayer";
  name: string;
  led_by: string | null;
}

export interface LiturgySlide extends SlideBase {
  kind: "liturgy";
  name: string;
  /** Paragraphs, each a list of lines. */
  blocks: string[][];
  page: number;
  page_count: number;
}

export interface ScriptureSlide extends SlideBase {
  kind: "scripture";
  reference: string;
  verses: NumberedVerse[];
  page: number;
  page_count: number;
  may_resplit: boolean;
}

export interface KeyVerseSlide extends SlideBase {
  kind: "key_verse";
  reference: string;
  verses: NumberedVerse[];
}

export type Slide =
  | TitleSlide
  | HymnVerseSlide
  | PrayerSlide
  | LiturgySlide
  | ScriptureSlide
  | KeyVerseSlide;

export interface Deck {
  plan_id: string;
  service_title: string;
  slides: Slide[];
}