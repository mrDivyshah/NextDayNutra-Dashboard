"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      style={{
        background: "transparent",
        border: "1px solid rgba(255,255,255,0.24)",
        color: "#fff",
        borderRadius: 999,
        padding: "8px 14px",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      Logout
    </button>
  );
}
