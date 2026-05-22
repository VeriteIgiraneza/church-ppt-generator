import { useEffect, useMemo, useState } from "react";
import {
  createHymn,
  deleteHymn,
  getHymns,
  updateHymn,
} from "../../shared/api/client";
import type { Hymn } from "../../types/hymn";

type Mode =
  | { kind: "idle" }
  | { kind: "create" }
  | { kind: "edit"; originalId: number };

type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const EMPTY_FORM = {
  hymn_id: "",
  title: "",
  author: "",
  category: "",
  verses: [""] as string[],
};

/** "Line 1|Line 2||Verse 2 line 1" → ["Line 1\nLine 2", "Verse 2 line 1"] */
function parseVersesString(verses: string): string[] {
  if (!verses) return [""];
  const result = verses
    .split("||")
    .map((v) => v.split("|").join("\n"));
  return result.length > 0 ? result : [""];
}

/** ["Line 1\nLine 2", "Verse 2 line 1"] → "Line 1|Line 2||Verse 2 line 1" */
function serializeVerses(verses: string[]): string {
  return verses
    .map((v) => v.split("\n").join("|"))
    .join("||");
}

export function HymnEditor() {
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>({ kind: "idle" });
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });

  // Load hymns on mount
  useEffect(() => {
    refresh();
  }, []);

  function refresh() {
    getHymns()
      .then(setHymns)
      .catch((err) =>
        setStatus({ kind: "error", message: `Failed to load: ${err.message}` })
      );
  }

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

  function startCreate() {
    setMode({ kind: "create" });
    setForm(EMPTY_FORM);
    setStatus({ kind: "idle" });
  }

  function startEdit(hymn: Hymn) {
    setMode({ kind: "edit", originalId: hymn.hymn_id });
    setForm({
      hymn_id: String(hymn.hymn_id),
      title: hymn.title,
      author: hymn.author,
      category: hymn.category,
      verses: parseVersesString(hymn.verses),
    });
    setStatus({ kind: "idle" });
  }

  function cancel() {
    setMode({ kind: "idle" });
    setForm(EMPTY_FORM);
    setStatus({ kind: "idle" });
  }

  async function handleSave() {
    // Validation
    const idNum = Number(form.hymn_id);
    if (!form.hymn_id.trim() || !Number.isInteger(idNum) || idNum <= 0) {
      setStatus({
        kind: "error",
        message: "Hymn ID must be a positive whole number",
      });
      return;
    }
    if (!form.title.trim()) {
      setStatus({ kind: "error", message: "Title is required" });
      return;
    }
    const nonEmptyVerses = form.verses.filter((v) => v.trim().length > 0);
    if (nonEmptyVerses.length === 0) {
      setStatus({ kind: "error", message: "At least one verse is required" });
      return;
    }

    const payload: Hymn = {
      hymn_id: idNum,
      title: form.title.trim(),
      author: form.author.trim(),
      category: form.category.trim(),
      verses: serializeVerses(nonEmptyVerses),
    };

    setStatus({ kind: "saving" });
    try {
      if (mode.kind === "create") {
        await createHymn(payload);
        setStatus({
          kind: "success",
          message: `Hymn ${idNum} created`,
        });
      } else if (mode.kind === "edit") {
        await updateHymn(mode.originalId, payload);
        setStatus({
          kind: "success",
          message: `Hymn ${idNum} updated`,
        });
      }
      refresh();
      setMode({ kind: "idle" });
      setForm(EMPTY_FORM);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus({ kind: "error", message });
    }
  }

  async function handleDelete(hymn: Hymn) {
    const confirmed = window.confirm(
      `Delete hymn ${hymn.hymn_id} "${hymn.title}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setStatus({ kind: "saving" });
    try {
      await deleteHymn(hymn.hymn_id);
      setStatus({
        kind: "success",
        message: `Hymn ${hymn.hymn_id} deleted`,
      });
      refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus({ kind: "error", message });
    }
  }

  const isEditing = mode.kind !== "idle";

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
      {/* Left: list */}
      <div style={{ flex: "1 1 50%", minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.2rem" }}>
            All hymns{" "}
            <span style={{ color: "#888", fontWeight: "normal", fontSize: "0.9rem" }}>
              ({hymns.length})
            </span>
          </h2>
          <button
            onClick={startCreate}
            disabled={isEditing}
            style={{
              padding: "8px 16px",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "white",
              background: isEditing ? "#aaa" : "#2c7a2c",
              border: "none",
              borderRadius: 6,
              cursor: isEditing ? "not-allowed" : "pointer",
            }}
          >
            + New hymn
          </button>
        </div>

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
            marginBottom: 12,
          }}
        />

        <div
          style={{
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            overflow: "hidden",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          {filtered.length === 0 && (
            <p style={{ padding: 16, color: "#999", fontStyle: "italic", margin: 0 }}>
              No hymns match.
            </p>
          )}
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {filtered.map((hymn) => (
              <li
                key={hymn.hymn_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderBottom: "1px solid #f0f0f0",
                  background:
                    mode.kind === "edit" && mode.originalId === hymn.hymn_id
                      ? "#eef5ff"
                      : "white",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>
                    {hymn.hymn_id} {hymn.title}
                  </strong>
                  {hymn.author && (
                    <span
                      style={{ color: "#666", marginLeft: 6, fontSize: "0.88rem" }}
                    >
                      — {hymn.author}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => startEdit(hymn)}
                    disabled={isEditing}
                    style={{
                      padding: "4px 10px",
                      fontSize: "0.85rem",
                      border: "1px solid #ddd",
                      borderRadius: 4,
                      background: "white",
                      cursor: isEditing ? "not-allowed" : "pointer",
                      color: "#444",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(hymn)}
                    disabled={isEditing}
                    style={{
                      padding: "4px 10px",
                      fontSize: "0.85rem",
                      border: "1px solid #f0c4c4",
                      borderRadius: 4,
                      background: "white",
                      cursor: isEditing ? "not-allowed" : "pointer",
                      color: "#a33",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right: editor */}
      <div
        style={{
          flex: "1 1 50%",
          minWidth: 0,
          position: "sticky",
          top: 24,
        }}
      >
        {mode.kind === "idle" ? (
          <div
            style={{
              padding: 32,
              border: "2px dashed #ddd",
              borderRadius: 8,
              textAlign: "center",
              color: "#999",
            }}
          >
            <p style={{ margin: 0 }}>
              Click <strong>+ New hymn</strong> to add one, or <strong>Edit</strong>{" "}
              on a hymn in the list.
            </p>
          </div>
        ) : (
          <div
            style={{
              padding: 20,
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              background: "white",
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>
              {mode.kind === "create" ? "New hymn" : `Edit hymn ${mode.originalId}`}
            </h2>

            <FormField label="Hymn ID" required>
              <input
                type="number"
                value={form.hymn_id}
                onChange={(e) => setForm({ ...form, hymn_id: e.target.value })}
                style={inputStyle}
                placeholder="e.g., 12"
              />
            </FormField>

            <FormField label="Title" required>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={inputStyle}
                placeholder="e.g., Amazing Grace"
              />
            </FormField>

            <FormField label="Author">
              <input
                type="text"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                style={inputStyle}
                placeholder="e.g., John Newton"
              />
            </FormField>

            <FormField label="Category">
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                style={inputStyle}
                placeholder="e.g., Worship"
              />
            </FormField>

            <FormField label="Verses" required>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {form.verses.map((verse, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "2px solid #ddd",
                      borderRadius: 6,
                      background: "#fafafa",
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#888",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        Verse {idx + 1}
                      </span>
                      {form.verses.length > 1 && (
                        <button
                          onClick={() => {
                            const next = form.verses.filter((_, i) => i !== idx);
                            setForm({ ...form, verses: next });
                          }}
                          style={{
                            padding: "2px 8px",
                            fontSize: "0.8rem",
                            border: "1px solid #f0c4c4",
                            borderRadius: 4,
                            background: "white",
                            cursor: "pointer",
                            color: "#a33",
                          }}
                          title="Remove this verse"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      value={verse}
                      onChange={(e) => {
                        const next = [...form.verses];
                        next[idx] = e.target.value;
                        setForm({ ...form, verses: next });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.shiftKey) {
                          e.preventDefault();
                          const textarea = e.currentTarget;
                          const cursorPos = textarea.selectionStart;
                          const fullText = textarea.value;
                          const before = fullText.slice(0, cursorPos);
                          const after = fullText.slice(cursorPos);

                          const next = [...form.verses];
                          next[idx] = before;
                          next.splice(idx + 1, 0, after);
                          setForm({ ...form, verses: next });
                        }
                      }}
                      style={{
                        ...inputStyle,
                        fontFamily: "Georgia, serif",
                        fontSize: "0.9rem",
                        minHeight: 100,
                        resize: "vertical",
                        background: "white",
                      }}
                      placeholder={`Verse ${idx + 1} — one line per row`}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() =>
                  setForm({ ...form, verses: [...form.verses, ""] })
                }
                style={{
                  marginTop: 10,
                  padding: "6px 14px",
                  fontSize: "0.88rem",
                  border: "1px dashed #aaa",
                  borderRadius: 6,
                  background: "white",
                  cursor: "pointer",
                  color: "#444",
                }}
              >
                + Add verse
              </button>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "0.8rem",
                  color: "#888",
                  fontStyle: "italic",
                }}
              >
                One verse per box. Press Enter for new lines within a verse.
                Press <kbd>Shift</kbd>+<kbd>Enter</kbd> to split into a new verse at the cursor.
              </p>
            </FormField>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                onClick={handleSave}
                disabled={status.kind === "saving"}
                style={{
                  padding: "10px 20px",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  color: "white",
                  background: status.kind === "saving" ? "#aaa" : "#2c7a2c",
                  border: "none",
                  borderRadius: 6,
                  cursor: status.kind === "saving" ? "not-allowed" : "pointer",
                }}
              >
                {status.kind === "saving"
                  ? "Saving..."
                  : mode.kind === "create"
                  ? "Create hymn"
                  : "Save changes"}
              </button>
              <button
                onClick={cancel}
                disabled={status.kind === "saving"}
                style={{
                  padding: "10px 20px",
                  fontSize: "0.95rem",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  background: "white",
                  cursor: "pointer",
                  color: "#444",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {status.kind === "success" && (
          <p style={{ marginTop: 12, color: "#2c7a2c" }}>✓ {status.message}</p>
        )}
        {status.kind === "error" && (
          <p style={{ marginTop: 12, color: "crimson" }}>⚠ {status.message}</p>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          display: "block",
          marginBottom: 4,
          fontSize: "0.88rem",
          color: "#444",
          fontWeight: 600,
        }}
      >
        {label}
        {required && <span style={{ color: "crimson", marginLeft: 4 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  fontSize: "0.95rem",
  border: "2px solid #ddd",
  borderRadius: 6,
  boxSizing: "border-box",
};