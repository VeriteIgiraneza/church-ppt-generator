import { useEffect, useState } from "react";
import { searchHymns } from "../../shared/api/client";
import { useDebounce } from "../../shared/hooks/useDebounce";
import type { Hymn } from "../../types/hymn";

interface Props {
  label: string;
  selected: Hymn | null;
  onSelect: (hymn: Hymn | null) => void;
}

export function HymnPicker({ label, selected, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<Hymn[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (selected) return; // don't search while a hymn is selected
    if (!debouncedQuery) {
      setResults([]);
      return;
    }
    searchHymns(debouncedQuery).then(setResults).catch(() => setResults([]));
  }, [debouncedQuery, selected]);

  return (
    <div style={{ marginBottom: 12 }}>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: 4,
            fontSize: "0.9rem",
            color: "#444",
            fontWeight: 600,
          }}
        >
          {label}
        </label>
      )}

      {selected ? (
        <div
          style={{
            padding: "10px 14px",
            background: "#e8f5e8",
            border: "1px solid #b6dab6",
            borderRadius: 6,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            <strong>{selected.hymn_id} {selected.title} </strong>
            {selected.author && (
              <span style={{ color: "#666", marginLeft: 6 }}>
                 {selected.author}
              </span>
            )}
          </span>
          <button
            onClick={() => {
              onSelect(null);
              setQuery("");
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "1.2rem",
              color: "#666",
            }}
            title="Remove"
          >
            ×
          </button>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Search by title, author, or hymn number..."
            style={{
              width: "100%",
              padding: "8px 12px",
              fontSize: "1rem",
              border: "2px solid #ddd",
              borderRadius: 6,
              boxSizing: "border-box",
            }}
          />

          {showResults && results.length > 0 && (
            <ul
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "white",
                border: "1px solid #ddd",
                borderRadius: 6,
                marginTop: 4,
                maxHeight: 240,
                overflowY: "auto",
                listStyle: "none",
                padding: 0,
                zIndex: 10,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {results.map((hymn) => (
                <li
                  key={hymn.hymn_id}
                  onMouseDown={() => {
                    onSelect(hymn);
                    setQuery("");
                    setShowResults(false);
                  }}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f5f5f5";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "white";
                  }}
                >
                  <strong>{hymn.hymn_id}</strong> {hymn.title}
                  {hymn.author && (
                    <span style={{ color: "#666", marginLeft: 6 }}>
                      — {hymn.author}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}