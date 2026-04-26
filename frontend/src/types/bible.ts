// Mirrors the Pydantic BibleVerse model in backend/app/models/bible.py

export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}