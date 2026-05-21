import { useEffect, useMemo, useState } from "react";
import { BibleSelector } from "./features/bible/BibleSelector";
import type { AllowedRange } from "./features/bible/BibleSelector";
import { GenerateButton } from "./features/generate/GenerateButton";
import { HymnPicker } from "./features/hymns/HymnPicker";
import { PrayerLeaderSelector } from "./features/prayer/PrayerLeaderSelector";
import { FlowItem } from "./features/service-flow/FlowItem";
import { HymnLibrary } from "./features/hymn-library/HymnLibrary";
import { HymnEditor } from "./features/hymn-editor/HymnEditor";
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

  const [activeTab, setActiveTab] = useState<"service" | "hymns">("service");

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

  // Build the list of chapter ranges the user picked for the Bible reading.
  // The Key Verse picker uses this to constrain its dropdowns so the user
  // can't select a verse outside what's actually being read.
  const keyVerseAllowedRanges: AllowedRange[] | undefined = bibleReading
    ? [
        {
          chapter: bibleReading.chapter,
          start_verse: bibleReading.start_verse,
          end_verse: bibleReading.end_verse,
        },
        ...(bibleReading.next_chapter !== undefined &&
        bibleReading.next_start_verse !== undefined &&
        bibleReading.next_end_verse !== undefined
          ? [
              {
                chapter: bibleReading.next_chapter,
                start_verse: bibleReading.next_start_verse,
                end_verse: bibleReading.next_end_verse,
              },
            ]
          : []),
      ]
    : undefined;

  const { request, validationMessage } = useMemo(() => {
    // Hymns are now individually optional — empty slots are silently skipped
    // when generating the deck. Service title, prayer leader, bible reading,
    // and key verse remain required.
    const missing: string[] = [];
    if (!serviceTitle.trim()) missing.push("service title");
    if (!prayerLeader) missing.push("prayer leader");
    if (!bibleReading) missing.push("bible reading");
    if (!keyVerse) missing.push("key verse");

    if (missing.length > 0) {
      return {
        request: null,
        validationMessage: null,
      };
    }

    return {
      request: {
        service_title: serviceTitle.trim(),
        hymn_ids: hymns.map((h) => (h ? h.hymn_id : null)),
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
        padding: "110px 24px 24px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* <div
        style={{
          position: "sticky",
          top: 0,
          background: "#f8ffc8",
          zIndex: 100,
          padding: "12px 24px 0",
          margin: "0 -24px 24px",
          borderBottom: "2px solid #e0e0e0",
        }}
      > */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "#f8ffc8",
          zIndex: 100,
          padding: "12px 24px 0",
          borderBottom: "2px solid #e0e0e0",
          transform: "translateZ(0)",
          willChange: "transform",
          backfaceVisibility: "hidden",
        }}
      >


        <h1 style={{ margin: "0 0 16px" }}>Church PowerPoint Generator</h1>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
          }}
        >
          <TabButton
            active={activeTab === "service"}
            onClick={() => setActiveTab("service")}
          >
            Build service
          </TabButton>
          <TabButton
            active={activeTab === "hymns"}
            onClick={() => setActiveTab("hymns")}
          >
            Manage hymns
          </TabButton>
        </div>
      </div>

      {activeTab === "hymns" ? (
        <HymnEditor />
      ) : (
        <div
          style={{
            display: "flex",
            gap: 24,
            alignItems: "flex-start",
          }}
        >
          {/* Left column: the form */}
          <div style={{ flex: "1 1 60%", minWidth: 0 }}>

      <section style={{ marginBottom: 24 }}>
        <p>
          Backend:{" "}
          {healthState.status === "loading" && "checking..."}
          {healthState.status === "success" && `${healthState.data}`}
          {healthState.status === "error" && `${healthState.message}`}
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
              allowedRanges={keyVerseAllowedRanges}
            />
          ) : (
            <p style={{ color: "#999", fontStyle: "italic", margin: 0 }}>
              Pick a Bible reading first
            </p>
          )}
        </FlowItem>

        <FlowItem label="The Lord's Prayer" readOnly />
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
      {/* /Left column */}

      {/* Right column: sticky sidebar */}
          <aside
            style={{
              flex: "1 1 40%",
              minWidth: 320,
              position: "sticky",
              top: 24,
              height: "calc(100vh - 48px)",
            }}
          >
            <HymnLibrary />
          </aside>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px",
        fontSize: "1rem",
        fontWeight: active ? 600 : 400,
        color: active ? "#2c7a2c" : "#666",
        background: "transparent",
        border: "none",
        borderBottom: active ? "3px solid #2c7a2c" : "3px solid transparent",
        marginBottom: "-2px",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default App;