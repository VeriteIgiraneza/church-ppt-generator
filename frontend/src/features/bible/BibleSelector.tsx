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
  onChange?: (ref: BibleReference | null) => void;
  fixedBook?: string;
  /** Allow the "continue to next chapter" toggle. Off by default. */
  allowNextChapter?: boolean;
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

export function BibleSelector({ onChange, fixedBook, allowNextChapter = false }: Props) {
  const [books, setBooks] = useState<string[]>([]);
  const [chapters, setChapters] = useState<number[]>([]);
  const [verses, setVerses] = useState<number[]>([]);
  const [nextVerses, setNextVerses] = useState<number[]>([]);

  const [book, setBook] = useState(fixedBook ?? "");
  const [chapter, setChapter] = useState<number | "">("");
  const [startVerse, setStartVerse] = useState<number | "">("");
  const [endVerse, setEndVerse] = useState<number | "">("");

  // Next-chapter state
  const [useNextChapter, setUseNextChapter] = useState(false);
  const [nextChapter, setNextChapter] = useState<number | "">("");
  const [nextStartVerse, setNextStartVerse] = useState<number | "">("");
  const [nextEndVerse, setNextEndVerse] = useState<number | "">("");

  const [passage, setPassage] = useState<BibleVerse[]>([]);
  const [nextPassage, setNextPassage] = useState<BibleVerse[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    getBibleBooks()
      .then(setBooks)
      .catch((err) => setError(`Failed to load books: ${err.message}`));
  }, []);

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
    setUseNextChapter(false);
    setNextChapter("");

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

  // Load verses for the next chapter dropdown
  useEffect(() => {
    setNextVerses([]);
    setNextStartVerse("");
    setNextEndVerse("");
    setNextPassage([]);

    if (!book || nextChapter === "") return;
    getBibleVerseNumbers(book, Number(nextChapter))
      .then(setNextVerses)
      .catch((err) =>
        setError(`Failed to load next-chapter verses: ${err.message}`)
      );
  }, [book, nextChapter]);

  // Reset next-chapter fields when toggle goes off
  useEffect(() => {
    if (!useNextChapter) {
      setNextChapter("");
      setNextStartVerse("");
      setNextEndVerse("");
      setNextPassage([]);
    }
  }, [useNextChapter]);

  // Notify parent + load passage previews
  useEffect(() => {
    setError("");

    const mainComplete =
      book &&
      chapter !== "" &&
      startVerse !== "" &&
      endVerse !== "" &&
      Number(endVerse) >= Number(startVerse);

    if (!mainComplete) {
      setPassage([]);
      onChange?.(null);
      return;
    }

    // If next-chapter toggle is on, require all 3 next-* fields
    const nextRequested = useNextChapter;
    const nextComplete =
      nextChapter !== "" &&
      nextStartVerse !== "" &&
      nextEndVerse !== "" &&
      Number(nextEndVerse) >= Number(nextStartVerse);

    if (nextRequested && !nextComplete) {
      // Don't report a partial reference upstream — wait until next-chapter is filled in
      onChange?.(null);
    } else {
      onChange?.({
        book,
        chapter: Number(chapter),
        start_verse: Number(startVerse),
        end_verse: Number(endVerse),
        ...(nextRequested && nextComplete
          ? {
              next_chapter: Number(nextChapter),
              next_start_verse: Number(nextStartVerse),
              next_end_verse: Number(nextEndVerse),
            }
          : {}),
      });
    }

    // Fetch main passage preview
    getBiblePassage(book, Number(chapter), Number(startVerse), Number(endVerse))
      .then(setPassage)
      .catch((err) => setError(`Failed to load passage: ${err.message}`));

    // Fetch next-chapter passage preview if applicable
    if (nextRequested && nextComplete) {
      getBiblePassage(
        book,
        Number(nextChapter),
        Number(nextStartVerse),
        Number(nextEndVerse)
      )
        .then(setNextPassage)
        .catch((err) =>
          setError(`Failed to load next-chapter passage: ${err.message}`)
        );
    } else {
      setNextPassage([]);
    }
  }, [
    book,
    chapter,
    startVerse,
    endVerse,
    useNextChapter,
    nextChapter,
    nextStartVerse,
    nextEndVerse,
  ]);

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

      {/* Next-chapter toggle */}
      {allowNextChapter && endVerse !== "" && (
        <div style={{ marginTop: 4, marginBottom: 12 }}>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              cursor: "pointer",
              userSelect: "none",
              color: "#444",
            }}
          >
            <input
              type="checkbox"
              checked={useNextChapter}
              onChange={(e) => setUseNextChapter(e.target.checked)}
              style={{ marginRight: 8 }}
            />
            Continue to next chapter
          </label>
        </div>
      )}

      {/* Next-chapter dropdowns */}
      {allowNextChapter && useNextChapter && (
        <div style={{ marginTop: 8 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Next chapter</label>
            <select
              value={nextChapter}
              onChange={(e) =>
                setNextChapter(e.target.value ? Number(e.target.value) : "")
              }
              style={selectStyle}
            >
              <option value="">—</option>
              {chapters
                .filter((c) => chapter === "" || c > Number(chapter))
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Next start verse</label>
            <select
              value={nextStartVerse}
              onChange={(e) =>
                setNextStartVerse(
                  e.target.value ? Number(e.target.value) : ""
                )
              }
              style={selectStyle}
              disabled={nextChapter === ""}
            >
              <option value="">—</option>
              {nextVerses.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Next end verse</label>
            <select
              value={nextEndVerse}
              onChange={(e) =>
                setNextEndVerse(e.target.value ? Number(e.target.value) : "")
              }
              style={selectStyle}
              disabled={nextStartVerse === ""}
            >
              <option value="">—</option>
              {nextVerses
                .filter(
                  (v) => nextStartVerse === "" || v >= Number(nextStartVerse)
                )
                .map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}

      {/* Passage preview */}
      {(passage.length > 0 || nextPassage.length > 0) && (
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
            {useNextChapter && nextChapter !== "" && nextStartVerse !== "" && (
              <>
                , {nextChapter}:{nextStartVerse}
                {nextEndVerse !== nextStartVerse ? `-${nextEndVerse}` : ""}
              </>
            )}
          </p>
          <p style={{ margin: 0 }}>
            {passage.map((v) => (
              <span key={`p-${v.chapter}-${v.verse}`}>
                <strong style={{ marginRight: 4 }}>{v.verse}</strong>
                {v.text}{" "}
              </span>
            ))}
            {nextPassage.map((v) => (
              <span key={`n-${v.chapter}-${v.verse}`}>
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