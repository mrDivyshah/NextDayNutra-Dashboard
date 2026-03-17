"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await response.json().catch(() => ({}));
    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error || "Unable to reset password.");
      return;
    }

    setMessage(data.message || "Password updated successfully.");
    setTimeout(() => router.push("/login"), 1200);
  };

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, background: "#eef3f7" }}>
      <section style={{ width: "100%", maxWidth: 460, background: "#fff", borderRadius: 24, padding: 32, boxShadow: "0 24px 60px rgba(9, 30, 66, 0.12)" }}>
        <h1 style={{ margin: 0, fontSize: 30, color: "#102a43" }}>Reset password</h1>
        <p style={{ color: "#52667a", lineHeight: 1.6 }}>
          Choose a new password for your dashboard account.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ display: "block", marginBottom: 8, color: "#123E67", fontWeight: 700, fontSize: 14 }}>New password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
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

          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ display: "block", marginBottom: 8, color: "#123E67", fontWeight: 700, fontSize: 14 }}>Confirm password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
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
            {isSubmitting ? "Updating..." : "Reset password"}
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
