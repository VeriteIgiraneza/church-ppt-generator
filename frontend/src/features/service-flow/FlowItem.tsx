import type { ReactNode } from "react";

interface Props {
  label: string;
  detail?: string;
  /** When true, item is shown as read-only (auto / non-editable). */
  readOnly?: boolean;
  /** Optional children rendered as the editable control(s). */
  children?: ReactNode;
}

export function FlowItem({ label, detail, readOnly = false, children }: Props) {
  return (
    <div
      style={{
        padding: "14px 16px",
        marginBottom: 10,
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        background: readOnly ? "#fafafa" : "white",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: children ? 8 : 0,
        }}
      >
        <div>
          <strong style={{ color: readOnly ? "#666" : "#222" }}>{label}</strong>
          {detail && (
            <span style={{ color: "#666", marginLeft: 8 }}>— {detail}</span>
          )}
        </div>
        {readOnly && (
          <span
            style={{
              fontSize: "0.7rem",
              color: "#999",
              fontStyle: "italic",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
            title="This slide is always included"
          >
            auto
          </span>
        )}
      </div>
      {children}
    </div>
  );
}