import { useEffect, useMemo, useState } from "react";
import { getHymns } from "../../shared/api/client";
import type { Hymn } from "../../types/hymn";

/** Split a Hymn's `verses` field ("v1l1|v1l2||v2l1|v2l2") into [[v1l1,v1l2],[v2l1,v2l2]]. */
function parseVerses(verses: string): string[][] {
  return verses
    .split("||")
    .map((verse) => verse.split("|").map((line) => line.trim()))
    .filter((verse) => verse.some((line) => line.length > 0));
}

export function HymnLibrary() {
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    getHymns()
      .then(setHymns)
      .catch((err) => setError(err.message));
  }, []);

  // Filter on the client so typing feels instant — the full list lives in memory.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hymns;

    if (/^\d+$/.test(q)) {
      const id = Number(q);
      return hymns.filter((h) => h.hymn_id === id);
    }
    return hymns.filter(
      (h) =>
        h.title.toLowerCase().includes(q) ||
        h.author.toLowerCase().includes(q) ||
        h.category.toLowerCase().includes(q)
    );
  }, [hymns, query]);

  const selected = selectedId
    ? hymns.find((h) => h.hymn_id === selectedId) ?? null
    : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "white",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 16px 12px",
          borderBottom: "1px solid #e0e0e0",
          background: "#fafafa",
        }}
      >
        <h2 style={{ margin: "0 0 10px", fontSize: "1rem", color: "#444" }}>
          Hymn library
          <span
            style={{
              fontWeight: "normal",
              color: "#888",
              marginLeft: 8,
              fontSize: "0.85rem",
            }}
          >
            {hymns.length} hymns
          </span>
        </h2>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, author, category, or number..."
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: "0.95rem",
            border: "2px solid #ddd",
            borderRadius: 6,
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Top half: list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {error && (
          <p style={{ padding: 16, color: "crimson" }}>{error}</p>
        )}
        {!error && filtered.length === 0 && (
          <p
            style={{
              padding: 16,
              color: "#999",
              fontStyle: "italic",
            }}
          >
            No hymns match.
          </p>
        )}
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {filtered.map((hymn) => {
            const isSelected = hymn.hymn_id === selectedId;
            return (
              <li key={hymn.hymn_id}>
                <button
                  onClick={() => setSelectedId(hymn.hymn_id)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 16px",
                    border: "none",
                    borderBottom: "1px solid #f0f0f0",
                    background: isSelected ? "#eef5ff" : "white",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "#fafafa";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "white";
                  }}
                >
                  <strong>{hymn.hymn_id} {hymn.title}</strong>
                  {hymn.author && (
                    <span
                      style={{
                        color: "#666",
                        marginLeft: 6,
                        fontSize: "0.88rem",
                      }}
                    >
                       {hymn.author}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom half: lyrics */}
      <div
        style={{
          borderTop: "2px solid #e0e0e0",
          background: "#fafafa",
          padding: 16,
          maxHeight: "50%",
          overflowY: "auto",
        }}
      >
        {!selected ? (
          <p
            style={{
              margin: 0,
              color: "#999",
              fontStyle: "italic",
              textAlign: "center",
            }}
          >
            Select a hymn above to view its lyrics
          </p>
        ) : (
          <HymnLyrics hymn={selected} />
        )}
      </div>
    </div>
  );
}

function HymnLyrics({ hymn }: { hymn: Hymn }) {
  const verses = parseVerses(hymn.verses);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: "1.05rem", color: "#222" }}>
          {hymn.hymn_id} {hymn.title}
        </h3>
        {hymn.author && (
          <p style={{ margin: "2px 0 0", color: "#666", fontSize: "0.85rem" }}>
            {hymn.author}
            {hymn.category && (
              <span style={{ color: "#999", marginLeft: 8 }}>
                · {hymn.category}
              </span>
            )}
          </p>
        )}
      </div>

      <div>
        {verses.map((lines, idx) => (
          <div key={idx} style={{ marginBottom: 14 }}>
            <div
              style={{
                fontSize: "0.75rem",
                color: "#999",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 4,
              }}
            >
              Verse {idx + 1}
            </div>
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "0.95rem",
                color: "#333",
                lineHeight: 1.5,
                whiteSpace: "pre-line",
              }}
            >
              {lines.join("\n")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}