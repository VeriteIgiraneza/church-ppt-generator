// Mirrors backend/app/models/service.py

export interface BibleReference {
  book: string;
  chapter: number;
  start_verse: number;
  end_verse: number;
  next_chapter?: number;
  next_start_verse?: number;
  next_end_verse?: number;
}

export interface GeneratePresentationRequest {
  service_title: string;
  /** 4 slots; null means "skip this hymn slot in the generated deck". */
  hymn_ids: (number | null)[];
  prayer_leader: string;
  bible_reading: BibleReference;
  key_verse: BibleReference;
  creed_name?: string;
}