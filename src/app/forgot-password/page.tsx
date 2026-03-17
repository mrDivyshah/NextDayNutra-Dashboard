"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");
    setResetUrl("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: identifier }),
    });

    const data = await response.json().catch(() => ({}));
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error || "Unable to process your request.");
      return;
    }

    setMessage(data.message || "If that account exists, a reset link has been created.");
    if (typeof data.resetUrl === "string") {
      setResetUrl(data.resetUrl);
    }
  };

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: "#eef3f7" }}>
      <section style={{ width: "100%", maxWidth: 460, background: "#fff", borderRadius: 24, padding: 32, boxShadow: "0 24px 60px rgba(9, 30, 66, 0.12)" }}>
        <h1 style={{ margin: 0, fontSize: 30, color: "#102a43" }}>Lost your password?</h1>
        <p style={{ color: "#52667a", lineHeight: 1.6 }}>
          Please enter your username or email address. You will receive an email message with instructions on how to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ display: "block", marginBottom: 8, color: "#123E67", fontWeight: 700, fontSize: 14 }}>Username or email address</span>
            <input
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 14,
                border: "1px solid #c9d4e1",
                background: "#fff",
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </label>

          {error && <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: "#fff1f0", color: "#9f2d24" }}>{error}</div>}
          {message && <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: "#edf7ed", color: "#1d5e20" }}>{message}</div>}
          {resetUrl && (
            <div style={{ marginBottom: 16, padding: 12, borderRadius: 12, background: "#eef4ff", color: "#123E67", wordBreak: "break-all" }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Reset link</div>
              <Link href={resetUrl} style={{ color: "#123E67" }}>{resetUrl}</Link>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              border: "none",
              borderRadius: 14,
              background: isSubmitting ? "#89a3be" : "#F05323",
              color: "#fff",
              padding: "15px 18px",
              fontWeight: 800,
              fontSize: 15,
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Submitting..." : "Request reset link"}
          </button>
        </form>

        <div style={{ marginTop: 18, fontSize: 14 }}>
          <Link href="/login" style={{ color: "#123E67", fontWeight: 700, textDecoration: "none" }}>
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
