import { useEffect, useMemo, useState } from "react";
import { BibleSelector } from "./features/bible/BibleSelector";
import { GenerateButton } from "./features/generate/GenerateButton";
import { HymnPicker } from "./features/hymns/HymnPicker";
import { PrayerLeaderSelector } from "./features/prayer/PrayerLeaderSelector";
import { FlowItem } from "./features/service-flow/FlowItem";
import { checkHealth } from "./shared/api/client";
import type { BibleReference } from "./types/service";
import type { Hymn } from "./types/hymn";
import "./App.css";

type LoadState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; message: string };

function App() {
  const [healthState, setHealthState] = useState<LoadState<string>>({
    status: "loading",
  });

  // Form state
  const [serviceTitle, setServiceTitle] = useState("");
  const [hymns, setHymns] = useState<(Hymn | null)[]>([null, null, null, null]);
  const [prayerLeader, setPrayerLeader] = useState("");
  const [bibleReading, setBibleReading] = useState<BibleReference | null>(null);
  const [keyVerse, setKeyVerse] = useState<BibleReference | null>(null);

  useEffect(() => {
    checkHealth()
      .then((data) => setHealthState({ status: "success", data: data.status }))
      .catch((err) => setHealthState({ status: "error", message: err.message }));
  }, []);

  const fixedKeyVerseBook = bibleReading?.book;

  const { request, validationMessage } = useMemo(() => {
    const missing: string[] = [];
    if (!serviceTitle.trim()) missing.push("service title");
    if (hymns.some((h) => h === null)) missing.push("all 4 hymns");
    if (!prayerLeader) missing.push("prayer leader");
    if (!bibleReading) missing.push("bible reading");
    if (!keyVerse) missing.push("key verse");

    if (missing.length > 0) {
      return {
        request: null,
        validationMessage: `Still need: ${missing.join(", ")}`,
      };
    }

    return {
      request: {
        service_title: serviceTitle.trim(),
        hymn_ids: hymns.map((h) => h!.hymn_id),
        prayer_leader: prayerLeader,
        bible_reading: bibleReading!,
        key_verse: keyVerse!,
      },
      validationMessage: null,
    };
  }, [serviceTitle, hymns, prayerLeader, bibleReading, keyVerse]);

  function updateHymn(index: number, hymn: Hymn | null) {
    const next = [...hymns];
    next[index] = hymn;
    setHymns(next);
  }

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "system-ui, sans-serif",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <h1>Church PowerPoint Generator</h1>

      <section style={{ marginBottom: 24 }}>
        <p>
          Backend:{" "}
          {healthState.status === "loading" && "⏳ checking..."}
          {healthState.status === "success" && `✅ ${healthState.data}`}
          {healthState.status === "error" && `❌ ${healthState.message}`}
        </p>
      </section>

      {/* Service title — sits above the flow */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.1rem", color: "#666" }}>Service title</h2>
        <input
          type="text"
          value={serviceTitle}
          onChange={(e) => setServiceTitle(e.target.value)}
          placeholder="e.g., Sunday Morning Worship"
          style={{
            width: "100%",
            padding: "10px 14px",
            fontSize: "1rem",
            border: "2px solid #ddd",
            borderRadius: 6,
            boxSizing: "border-box",
          }}
        />
      </section>

      {/* Service flow — everything in deck order */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.1rem", color: "#666" }}>Service flow</h2>

        <FlowItem
          label="Title slide"
          detail={serviceTitle.trim() || undefined}
          readOnly
        />

        <FlowItem label="Hymn 1">
          <HymnPicker
            label=""
            selected={hymns[0]}
            onSelect={(h) => updateHymn(0, h)}
          />
        </FlowItem>

        <FlowItem label="Hymn 2">
          <HymnPicker
            label=""
            selected={hymns[1]}
            onSelect={(h) => updateHymn(1, h)}
          />
        </FlowItem>

        <FlowItem label="Hymn 3">
          <HymnPicker
            label=""
            selected={hymns[2]}
            onSelect={(h) => updateHymn(2, h)}
          />
        </FlowItem>

        <FlowItem label="Two by Two Prayer" readOnly />

        <FlowItem label="The Apostles' Creed" readOnly />

        <FlowItem label="Personal Prayer" readOnly />

        <FlowItem label="Hymn 4">
          <HymnPicker
            label=""
            selected={hymns[3]}
            onSelect={(h) => updateHymn(3, h)}
          />
        </FlowItem>

        <FlowItem label="Representative Prayer">
          <PrayerLeaderSelector
            selected={prayerLeader}
            onChange={setPrayerLeader}
          />
        </FlowItem>

        <FlowItem
          label="Title slide (repeat)"
          detail={serviceTitle.trim() || undefined}
          readOnly
        />

        <FlowItem label="Bible reading">
          <BibleSelector onChange={setBibleReading} allowNextChapter/>
        </FlowItem>

        <FlowItem label="Key verse">
          {fixedKeyVerseBook ? (
            <BibleSelector
              onChange={setKeyVerse}
              fixedBook={fixedKeyVerseBook}
            />
          ) : (
            <p style={{ color: "#999", fontStyle: "italic", margin: 0 }}>
              Pick a Bible reading first
            </p>
          )}
        </FlowItem>
      </section>

      {/* Generate */}
      <section
        style={{
          paddingTop: 16,
          borderTop: "2px solid #eee",
        }}
      >
        <GenerateButton
          request={request}
          validationMessage={validationMessage}
        />
      </section>
    </div>
  );
}

export default App; 