import { useState } from "react";
import { generatePresentation, triggerDownload } from "../../shared/api/client";
import type { GeneratePresentationRequest } from "../../types/service";

interface Props {
  request: GeneratePresentationRequest | null;
  validationMessage: string | null;
}

export function GenerateButton({ request, validationMessage }: Props) {
  const [status, setStatus] = useState <
    | { kind: "idle" }
    | { kind: "generating" }
    | { kind: "success" }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const isDisabled = request === null || status.kind === "generating";

  async function handleClick() {
    if (!request) return;
    setStatus({ kind: "generating" });
    try {
      const blob = await generatePresentation(request);
      const filename = `church_service_${new Date()
        .toISOString()
        .slice(0, 10)}.pptx`;
      triggerDownload(blob, filename);
      setStatus({ kind: "success" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus({ kind: "error", message });
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isDisabled}
        style={{
          padding: "12px 24px",
          fontSize: "1rem",
          fontWeight: 600,
          color: "white",
          background: isDisabled ? "#aaa" : "#2c7a2c",
          border: "none",
          borderRadius: 6,
          cursor: isDisabled ? "not-allowed" : "pointer",
        }}
      >
        {status.kind === "generating"
          ? "Generating..."
          : "Generate PowerPoint"}
      </button>

      {validationMessage && status.kind === "idle" && (
        <p style={{ marginTop: 8, color: "#888", fontSize: "0.9rem" }}>
          {validationMessage}
        </p>
      )}
      {status.kind === "success" && (
        <p style={{ marginTop: 8, color: "#2c7a2c" }}>
          Downloaded
        </p>
      )}
      {status.kind === "error" && (
        <p style={{ marginTop: 8, color: "crimson" }}>
          {status.message}
        </p>
      )}
    </div>
  );
}