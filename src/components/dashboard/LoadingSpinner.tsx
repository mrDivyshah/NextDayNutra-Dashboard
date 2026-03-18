"use client";

import { RefreshCw } from "lucide-react";

export function LoadingSpinner() {
  return (
    <div
      style={{
        padding: "60px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#94a3b8",
        gap: 12,
      }}
    >
      <RefreshCw size={32} style={{ opacity: 0.4, animation: "spin 2s linear infinite" }} />
      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          margin: 0,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "#94a3b8",
        }}
      >
        Loading data…
      </p>
    </div>
  );
}
