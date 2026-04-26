import { useEffect, useState } from "react";
import { getPrayerLeaders } from "../../shared/api/client";
import type { PrayerLeader } from "../../types/prayer";

interface Props {
  selected: string;
  onChange: (name: string) => void;
}

export function PrayerLeaderSelector({ selected, onChange }: Props) {
  const [leaders, setLeaders] = useState<PrayerLeader[]>([]);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    getPrayerLeaders()
      .then(setLeaders)
      .catch((err) => setError(`Failed to load prayer leaders: ${err.message}`));
  }, []);

  return (
    <div>
      {error && <p style={{ color: "crimson" }}>⚠ {error}</p>}

      <label
        style={{
          display: "block",
          marginBottom: 4,
          fontSize: "0.9rem",
          color: "#444",
          fontWeight: 600,
        }}
      >
        Representative Prayer leader
      </label>
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "8px 12px",
          fontSize: "1rem",
          border: "2px solid #ddd",
          borderRadius: 6,
          background: "white",
          minWidth: 240,
        }}
      >
        <option value="">— select a prayer leader —</option>
        {leaders.map((leader) => (
          <option key={leader.name} value={leader.name}>
            {leader.name}
          </option>
        ))}
      </select>
    </div>
  );
}