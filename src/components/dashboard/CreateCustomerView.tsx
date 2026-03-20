"use client";

import React, { useState, useTransition } from "react";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  Users
} from "lucide-react";

type CreateCustomerViewProps = {
  currentUserRole?: string | null;
  onBack: () => void;
};

type CreateCustomerFormState = {
  companyName: string;
  email: string;
  emailNotifications: string;
  phone: string;
  accountManager: string;
  accountManagerEmail: string;
  agent: string;
  consent: string;
};

const INITIAL_FORM: CreateCustomerFormState = {
  companyName: "",
  email: "",
  emailNotifications: "",
  phone: "",
  accountManager: "Rachel",
  accountManagerEmail: "",
  agent: "",
  consent: "",
};

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const array = new Uint32Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (value) => chars[value % chars.length]).join("");
}

function FieldBlock({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: "#123e67", letterSpacing: "0.02em" }}>{label}</span>
      {children}
      {hint ? <span style={{ fontSize: 11, color: "#64748b" }}>{hint}</span> : null}
    </label>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    minHeight: 44,
    borderRadius: 12,
    border: "1px solid #d7e0ea",
    background: "#ffffff",
    boxShadow: "inset 0 1px 2px rgba(15,23,42,0.03)",
    padding: "0 14px",
    fontSize: 14,
    color: "#0f172a",
    outline: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    boxSizing: "border-box",
  };
}

export function CreateCustomerView({ currentUserRole, onBack }: CreateCustomerViewProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const updateField = (key: keyof CreateCustomerFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const payload = {
          ...form,
          name: form.companyName, // Alias company name to name for API compatibility
          password: generatePassword(), // Silently provide required password
          confirmPassword: "", // Ignored but passes schema if required
        };

        const response = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          setError(data?.error || "Unable to create customer.");
          return;
        }

        setSuccess("Customer account created successfully.");
        setForm(INITIAL_FORM);
      } catch {
        setError("Network error while creating customer.");
      }
    });
  };

  const canSubmit = !!form.companyName && !!form.email;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", minHeight: 0 }}>
      {/* BRANDED HEADER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "18px 20px",
          borderRadius: 18,
          border: "1px solid #dbe5ef",
          background: "linear-gradient(135deg, rgba(18,62,103,0.98) 0%, rgba(17,84,138,0.95) 65%, rgba(240,83,35,0.92) 100%)",
          color: "#fff",
          boxShadow: "0 20px 40px -28px rgba(18,62,103,0.8)",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", opacity: 0.78, textTransform: "uppercase" }}>
            Customer Dashboard
          </div>
          <h2 style={{ margin: "8px 0 6px", fontSize: 30, lineHeight: 1.1, fontWeight: 800 }}>Create New Customer</h2>
          <p style={{ margin: 0, maxWidth: 700, fontSize: 14, lineHeight: 1.6, color: "rgba(255,255,255,0.84)" }}>
            Provision a customer portal account inside your dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
            height: 42,
            padding: "0 16px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.24)",
            background: "rgba(255,255,255,0.12)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </button>
      </div>

      {/* 2-COLUMN LAYOUT */}
      <div
        style={{
        
          minHeight: 0
        }}
      >
        {/* FORM COLUMN */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            minHeight: 0,
            overflow: "auto",
          }}
        >
          {/* Company Profile Area */}
          <div style={{ padding: 20, borderRadius: 18, border: "1px solid #e2e8f0", background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: "#fff1eb",
                  color: "#f05323",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Building2 size={18} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Customer Profile</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Core primary contact and naming information.</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(1, minmax(0, 1fr))", gap: 14 }}>
              <FieldBlock label="New Customer Company Name">
                <input
                  value={form.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  style={inputStyle()}
                  required
                />
              </FieldBlock>

              <FieldBlock label="Customer Email (Dashboard Access)">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  style={inputStyle()}
                  required
                />
              </FieldBlock>
            </div>
          </div>

          {/* Communications Area */}
          <div style={{ padding: 20, borderRadius: 18, border: "1px solid #e2e8f0", background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: "#e8eff6",
                  color: "#123e67",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserRound size={18} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Communications & Account Management</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Agent assignment and notification configurations.</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
              <FieldBlock label="Customer Email (Notifications)">
                <input
                  type="email"
                  value={form.emailNotifications}
                  onChange={(e) => updateField("emailNotifications", e.target.value)}
                  style={inputStyle()}
                />
              </FieldBlock>
              
              <FieldBlock label="Customer Mobile (SMS)">
                <input
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  style={inputStyle()}
                />
              </FieldBlock>

              <FieldBlock label="Account Manager">
                <select
                  value={form.accountManager}
                  onChange={(e) => updateField("accountManager", e.target.value)}
                  style={{ ...inputStyle() }}
                >
                  <option value="Rachel">Rachel</option>
                  <option value="John">John</option>
                  <option value="Sarah">Sarah</option>
                </select>
              </FieldBlock>

              <FieldBlock label="Account Manager Email">
                <input
                  type="email"
                  value={form.accountManagerEmail}
                  onChange={(e) => updateField("accountManagerEmail", e.target.value)}
                  style={inputStyle()}
                />
              </FieldBlock>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(1, minmax(0, 1fr))", gap: 14, marginTop: 14 }}>
              <FieldBlock label="Select Agent">
                <select
                  value={form.agent}
                  onChange={(e) => updateField("agent", e.target.value)}
                  style={{ ...inputStyle(), color: form.agent ? "#0f172a" : "#94a3b8" }}
                >
                  <option value="" disabled hidden>Search for an agent...</option>
                  <option value="agent1">Agent 1</option>
                  <option value="agent2">Agent 2</option>
                </select>
              </FieldBlock>

              <FieldBlock label="Consent for Notifications">
                <input
                  value={form.consent}
                  onChange={(e) => updateField("consent", e.target.value)}
                  placeholder="Record meeting (date/time) and verbal consent of the customer for SMS and email..."
                  style={inputStyle()}
                />
              </FieldBlock>
            </div>
          </div>

          {(error || success) && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 14,
                border: `1px solid ${error ? "#fecaca" : "#bbf7d0"}`,
                background: error ? "#fef2f2" : "#f0fdf4",
                color: error ? "#b91c1c" : "#166534",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {error || success}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 8 }}>
            <button
              type="submit"
              disabled={isPending || !canSubmit}
              style={{
                height: 46,
                padding: "0 18px",
                borderRadius: 14,
                border: "none",
                background: isPending || !canSubmit ? "#94a3b8" : "#f05323",
                color: "#fff",
                fontSize: 13,
                fontWeight: 800,
                cursor: isPending || !canSubmit ? "not-allowed" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 16px 30px -24px rgba(240,83,35,0.85)",
              }}
            >
              <Save size={15} />
              {isPending ? "Creating customer..." : "Create customer account"}
            </button>
          </div>
        </form>

        
      </div>
    </div>
  );
}

