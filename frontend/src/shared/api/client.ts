import type { BibleVerse } from "../../types/bible";
import type { Creed } from "../../types/creed";
import type { Hymn } from "../../types/hymn";
import type { PrayerLeader } from "../../types/prayer";
import type { GeneratePresentationRequest } from "../../types/service";

const API_BASE_URL = "http://localhost:8000";

// ----- Presentations -----
/**
 * POSTs a generation request and returns the resulting .pptx as a Blob.
 * Use this with `triggerDownload` to save the file.
 */
export async function generatePresentation(
  req: GeneratePresentationRequest
): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/api/presentations/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    // Try to parse JSON error detail; fall back to status text
    let detail = response.statusText;
    try {
      const data = await response.json();
      detail = data.detail ?? detail;
    } catch {
      // not JSON — keep statusText
    }
    throw new Error(`Generation failed (${response.status}): ${detail}`);
  }

  return response.blob();
}

/**
 * Saves a Blob as a file download in the browser.
 * Pulls the filename from the Content-Disposition header if available.
 */
export function triggerDownload(blob: Blob, fallbackFilename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fallbackFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

// ----- Health -----
export async function checkHealth(): Promise<{ status: string }> {
  return apiGet<{ status: string }>("/api/health");
}

// ----- Hymns -----
export async function getHymns(): Promise<Hymn[]> {
  return apiGet<Hymn[]>("/api/hymns");
}

export async function getHymn(hymnId: number): Promise<Hymn> {
  return apiGet<Hymn>(`/api/hymns/${hymnId}`);
}

export async function searchHymns(query: string): Promise<Hymn[]> {
  const params = new URLSearchParams({ q: query });
  return apiGet<Hymn[]>(`/api/hymns/search?${params.toString()}`);
}

// ----- Bible -----
export async function getBibleBooks(): Promise<string[]> {
  return apiGet<string[]>("/api/bible/books");
}

export async function getBibleChapters(book: string): Promise<number[]> {
  return apiGet<number[]>(`/api/bible/chapters/${encodeURIComponent(book)}`);
}

export async function getBibleVerseNumbers(
  book: string,
  chapter: number
): Promise<number[]> {
  return apiGet<number[]>(
    `/api/bible/verses/${encodeURIComponent(book)}/${chapter}`
  );
}

export async function getBiblePassage(
  book: string,
  chapter: number,
  startVerse: number,
  endVerse: number
): Promise<BibleVerse[]> {
  const params = new URLSearchParams({
    book,
    chapter: String(chapter),
    start_verse: String(startVerse),
    end_verse: String(endVerse),
  });
  return apiGet<BibleVerse[]>(`/api/bible/passage?${params.toString()}`);
}

// ----- Prayer leaders -----
export async function getPrayerLeaders(): Promise<PrayerLeader[]> {
  return apiGet<PrayerLeader[]>("/api/prayer-leaders");
}

// ----- Creeds -----
export async function getCreeds(): Promise<Creed[]> {
  return apiGet<Creed[]>("/api/creeds");
}

export async function getCreedByName(name: string): Promise<Creed> {
  return apiGet<Creed>(`/api/creeds/by-name/${encodeURIComponent(name)}`);
}