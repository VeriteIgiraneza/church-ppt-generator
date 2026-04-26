// Mirrors backend/app/models/creed.py

export interface Creed {
  creed_id: number;
  name: string;
  /**
   * Raw creed text. Paragraphs separated by '||', lines within a paragraph by '|'.
   */
  content: string;
}