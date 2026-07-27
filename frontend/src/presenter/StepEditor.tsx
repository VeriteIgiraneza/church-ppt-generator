import { useEffect, useState } from "react";
import { BibleSelector } from "../features/bible/BibleSelector";
import type { AllowedRange } from "../features/bible/BibleSelector";
import { HymnPicker } from "../features/hymns/HymnPicker";
import { PrayerLeaderSelector } from "../features/prayer/PrayerLeaderSelector";
import { getHymn } from "../shared/api/client";
import type { BibleReference } from "../types/service";
import type { Hymn } from "../types/hymn";
import { formatReference } from "./format";
import { PRAYER_REPRESENTATIVE } from "./types/plan";
import type { Step } from "./types/plan";

const note: React.CSSProperties = {
  margin: 0,
  color: "#999",
  fontStyle: "italic",
  fontSize: "0.9rem",
};

const linkBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#2c6fb3",
  cursor: "pointer",
  padding: 0,
  fontSize: "0.9rem",
  textDecoration: "underline",
};

interface Props {
  step: Step;
  onChange: (patch: Record<string, unknown>) => void;
  /** The reading that constrains the key verse picker, if one is set. */
  reading: BibleReference | null;
  keyVerseRanges?: AllowedRange[];
}

/** Renders whichever control a step needs, or a note if it needs none. */
export function StepEditor({ step, onChange, reading, keyVerseRanges }: Props) {
  switch (step.kind) {
    case "title":
      return <p style={note}>Shows the service title and the first reading.</p>;

    case "creed":
      return <p style={note}>{step.creed_name} — content comes from Creed.csv.</p>;

    case "lords_prayer":
      return <p style={note}>Content comes from lords_prayer.csv.</p>;

    case "hymn":
      return (
        <HymnStepEditor
          hymnId={step.hymn_id}
          onChange={(hymn) => onChange({ hymn_id: hymn ? hymn.hymn_id : null })}
        />
      );

    case "prayer":
      return (
        <div>
          <input
            type="text"
            value={step.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Prayer name"
            style={{
              width: "100%",
              maxWidth: 360,
              padding: "8px 12px",
              fontSize: "1rem",
              border: "2px solid #ddd",
              borderRadius: 6,
              boxSizing: "border-box",
              marginBottom: step.name === PRAYER_REPRESENTATIVE ? 12 : 0,
            }}
          />
          {step.name === PRAYER_REPRESENTATIVE && (
            <PrayerLeaderSelector
              selected={step.led_by ?? ""}
              onChange={(name) => onChange({ led_by: name || null })}
            />
          )}
        </div>
      );

    case "scripture":
      return (
        <RefStepEditor
          ref_={step.ref}
          onChange={(ref) => onChange({ ref })}
          allowNextChapter
        />
      );

    case "key_verse":
      if (!reading) {
        return <p style={note}>Pick a Bible reading first.</p>;
      }
      return (
        <RefStepEditor
          ref_={step.ref}
          onChange={(ref) => onChange({ ref })}
          fixedBook={reading.book}
          allowedRanges={keyVerseRanges}
        />
      );
  }
}

/** Loads the chosen hymn by number so HymnPicker can show it. */
function HymnStepEditor({
  hymnId,
  onChange,
}: {
  hymnId: number | null;
  onChange: (hymn: Hymn | null) => void;
}) {
  const [hymn, setHymn] = useState<Hymn | null>(null);

  useEffect(() => {
    if (hymnId === null) {
      setHymn(null);
      return;
    }
    if (hymn?.hymn_id === hymnId) return;
    getHymn(hymnId)
      .then(setHymn)
      .catch(() => setHymn(null));
  }, [hymnId]);

  return (
    <HymnPicker
      label=""
      selected={hymn}
      onSelect={(next) => {
        setHymn(next);
        onChange(next);
      }}
    />
  );
}

/**
 * Shows a saved reference as text with a Change button, and only mounts
 * BibleSelector once you're actually changing it.
 *
 * This matters: BibleSelector holds its own state and fires onChange(null)
 * while its dropdowns are still empty. Mounting it over a saved reference
 * would immediately wipe that reference.
 */
function RefStepEditor({
  ref_,
  onChange,
  fixedBook,
  allowNextChapter,
  allowedRanges,
}: {
  ref_: BibleReference | null;
  onChange: (ref: BibleReference | null) => void;
  fixedBook?: string;
  allowNextChapter?: boolean;
  allowedRanges?: AllowedRange[];
}) {
  const [editing, setEditing] = useState(ref_ === null);

  if (!editing && ref_) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontWeight: 600, color: "#222" }}>
          {formatReference(ref_)}
        </span>
        <button onClick={() => setEditing(true)} style={linkBtn}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div>
      <BibleSelector
        onChange={onChange}
        fixedBook={fixedBook}
        allowNextChapter={allowNextChapter}
        allowedRanges={allowedRanges}
      />
      {ref_ && (
        <button onClick={() => setEditing(false)} style={linkBtn}>
          Done
        </button>
      )}
    </div>
  );
}