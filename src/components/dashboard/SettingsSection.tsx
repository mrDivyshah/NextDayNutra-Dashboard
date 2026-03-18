"use client";

import { Settings } from "lucide-react";

export function SettingsSection() {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e2e8f0",
        padding: "40px",
        textAlign: "center",
      }}
    >
      <Settings size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
      <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
        Settings
      </h2>
      <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
        Workspace configuration options will appear here.
      </p>
    </div>
  );
}
