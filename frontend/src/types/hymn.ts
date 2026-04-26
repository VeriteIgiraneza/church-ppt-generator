// Mirrors the Pydantic Hymn model in backend/app/models/hymn.py
// If you change the backend model, change this too.

export interface Hymn {
  hymn_id: number;
  title: string;
  author: string;
  category: string;
  /**
   * Raw verse text. Verses separated by '||', lines within a verse by '|'.
   * Example: "Line 1|Line 2||Verse 2 line 1|Verse 2 line 2"
   */
  verses: string;
}