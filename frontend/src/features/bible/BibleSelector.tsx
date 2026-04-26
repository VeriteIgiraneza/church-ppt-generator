import { useEffect, useState } from "react";
import {
  getBibleBooks,
  getBibleChapters,
  getBibleVerseNumbers,
  getBiblePassage,
} from "../../shared/api/client";
import type { BibleVerse } from "../../types/bible";
import type { BibleReference } from "../../types/service";

interface Props {
  /** Optional callback so the parent can store the current selection. */
  onChange?: (ref: BibleReference | null) => void;
  /** Allow the parent to control the book externally (used by KeyVersePicker). */
  fixedBook?: string;
}

const selectStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: "1rem",
  border: "2px solid #ddd",
  borderRadius: 6,
  background: "white",
  marginRight: 8,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 4,
  fontSize: "0.9rem",
  color: "#444",
  fontWeight: 600,
};

const fieldStyle: React.CSSProperties = {
  marginRight: 16,
  marginBottom: 16,
  display: "inline-block",
};

export function BibleSelector({ onChange, fixedBook }: Props) {
  const [books, setBooks] = useState<string[]>([]);
  const [chapters, setChapters] = useState<number[]>([]);
  const [verses, setVerses] = useState<number[]>([]);

  const [book, setBook] = useState(fixedBook ?? "");
  const [chapter, setChapter] = useState<number | "">("");
  const [startVerse, setStartVerse] = useState<number | "">("");
  const [endVerse, setEndVerse] = useState<number | "">("");

  const [passage, setPassage] = useState<BibleVerse[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    getBibleBooks()
      .then(setBooks)
      .catch((err) => setError(`Failed to load books: ${err.message}`));
  }, []);

  // Sync external book changes (when fixedBook prop changes)
  useEffect(() => {
    if (fixedBook !== undefined && fixedBook !== book) {
      setBook(fixedBook);
    }
  }, [fixedBook]);

  useEffect(() => {
    setChapters([]);
    setVerses([]);
    setChapter("");
    setStartVerse("");
    setEndVerse("");
    setPassage([]);

    if (!book) return;
    getBibleChapters(book)
      .then(setChapters)
      .catch((err) => setError(`Failed to load chapters: ${err.message}`));
  }, [book]);

  useEffect(() => {
    setVerses([]);
    setStartVerse("");
    setEndVerse("");
    setPassage([]);

    if (!book || chapter === "") return;
    getBibleVerseNumbers(book, Number(chapter))
      .then(setVerses)
      .catch((err) => setError(`Failed to load verses: ${err.message}`));
  }, [book, chapter]);

  useEffect(() => {
    setPassage([]);
    setError("");

    if (
      !book ||
      chapter === "" ||
      startVerse === "" ||
      endVerse === "" ||
      Number(endVerse) < Number(startVerse)
    ) {
      onChange?.(null);
      return;
    }

    onChange?.({
      book,
      chapter: Number(chapter),
      start_verse: Number(startVerse),
      end_verse: Number(endVerse),
    });

    getBiblePassage(book, Number(chapter), Number(startVerse), Number(endVerse))
      .then(setPassage)
      .catch((err) => setError(`Failed to load passage: ${err.message}`));
  }, [book, chapter, startVerse, endVerse]);

  return (
    <div>
      {error && (
        <p style={{ color: "crimson", marginBottom: 12 }}>⚠ {error}</p>
      )}

      <div>
        {fixedBook === undefined && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Book</label>
            <select
              value={book}
              onChange={(e) => setBook(e.target.value)}
              style={selectStyle}
            >
              <option value="">— select —</option>
              {books.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        )}

        <div style={fieldStyle}>
          <label style={labelStyle}>Chapter</label>
          <select
            value={chapter}
            onChange={(e) =>
              setChapter(e.target.value ? Number(e.target.value) : "")
            }
            style={selectStyle}
            disabled={!book}
          >
            <option value="">—</option>
            {chapters.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Start verse</label>
          <select
            value={startVerse}
            onChange={(e) =>
              setStartVerse(e.target.value ? Number(e.target.value) : "")
            }
            style={selectStyle}
            disabled={chapter === ""}
          >
            <option value="">—</option>
            {verses.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>End verse</label>
          <select
            value={endVerse}
            onChange={(e) =>
              setEndVerse(e.target.value ? Number(e.target.value) : "")
            }
            style={selectStyle}
            disabled={startVerse === ""}
          >
            <option value="">—</option>
            {verses
              .filter((v) => startVerse === "" || v >= Number(startVerse))
              .map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
          </select>
        </div>
      </div>

      {passage.length > 0 && (
        <div
          style={{
            marginTop: 4,
            padding: 16,
            background: "#fafafa",
            border: "1px solid #e0e0e0",
            borderRadius: 6,
            lineHeight: 1.6,
          }}
        >
          <p style={{ fontWeight: 600, marginTop: 0, color: "#444" }}>
            {book} {chapter}:{startVerse}
            {endVerse !== startVerse ? `-${endVerse}` : ""}
          </p>
          <p style={{ margin: 0 }}>
            {passage.map((v) => (
              <span key={v.verse}>
                <strong style={{ marginRight: 4 }}>{v.verse}</strong>
                {v.text}{" "}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}