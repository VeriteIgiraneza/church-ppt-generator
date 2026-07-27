import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface NetworkInfo {
  addresses: string[];
  hostname: string;
}

function apiBase(): string {
  return (
    import.meta.env.VITE_API_BASE_URL ??
    `${window.location.protocol}//${window.location.hostname}:8000`
  );
}

/**
 * Shows the address to open the remote on, as a QR code.
 *
 * The port comes from this page rather than the backend, because the remote
 * is served by the same dev server or bundle that's serving the control view.
 * Only the host has to be discovered, and only the backend can discover it.
 */
export function RemotePanel() {
  const [info, setInfo] = useState<NetworkInfo | null>(null);
  const [chosen, setChosen] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`${apiBase()}/api/presenter/network`)
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo(null));
  }, []);

  const hosts = info ? [...info.addresses, info.hostname].filter(Boolean) : [];
  const host = hosts[chosen];
  const port = window.location.port ? `:${window.location.port}` : "";
  const url = host ? `http://${host}${port}/?view=remote` : "";

  if (!host) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <button onClick={() => setOpen((v) => !v)} style={btn}>
        {open ? "Hide phone remote" : "Phone remote"}
      </button>

      {open && (
        <div
          style={{
            marginTop: 12,
            padding: 16,
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            display: "inline-flex",
            gap: 20,
            alignItems: "center",
            background: "white",
          }}
        >
          <QRCodeSVG value={url} size={148} />

          <div style={{ fontSize: "0.9rem", color: "#444", maxWidth: 320 }}>
            <p style={{ margin: "0 0 8px", fontWeight: 600 }}>
              Scan with your phone
            </p>
            <code
              style={{
                display: "block",
                padding: "6px 10px",
                background: "#f4f4f4",
                borderRadius: 4,
                marginBottom: 10,
                wordBreak: "break-all",
              }}
            >
              {url}
            </code>
            <p style={{ margin: "0 0 10px", color: "#777", lineHeight: 1.45 }}>
              The phone must be on the same network as this laptop — a phone
              hotspot or USB tethering both work with no internet. Then use
              Share → Add to Home Screen to keep it one tap away.
            </p>
            {hosts.length > 1 && (
              <select
                value={chosen}
                onChange={(e) => setChosen(Number(e.target.value))}
                style={{
                  padding: "4px 8px",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                }}
              >
                {hosts.map((h, i) => (
                  <option key={h} value={i}>
                    {h}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const btn: React.CSSProperties = {
  padding: "8px 14px",
  fontSize: "0.9rem",
  border: "1px solid #ddd",
  borderRadius: 6,
  background: "white",
  cursor: "pointer",
  color: "#444",
};