"use client";

import React, { useMemo, useState, useTransition } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";

type CreateCustomerViewProps = {
  currentUserRole?: string | null;
  onBack: () => void;
};

type CreateCustomerFormState = {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  jiraId: string;
  password: string;
  confirmPassword: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  redirectUrl: string;
  additionalAccess: string;
  botField: string;
};

const INITIAL_FORM: CreateCustomerFormState = {
  name: "",
  email: "",
  phone: "",
  companyName: "",
  jiraId: "",
  password: "",
  confirmPassword: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
  redirectUrl: "",
  additionalAccess: "",
  botField: "",
};

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const array = new Uint32Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (value) => chars[value % chars.length]).join("");
}

function FieldBlock({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 800, color: "#123e67", letterSpacing: "0.02em" }}>{label}</span>
      {children}
      {hint ? <span style={{ fontSize: 11, color: "#64748b" }}>{hint}</span> : null}
    </label>
  );
}

function inputStyle(multiline?: boolean): React.CSSProperties {
  return {
    width: "100%",
    minHeight: multiline ? 96 : 44,
    borderRadius: 12,
    border: "1px solid #d7e0ea",
    background: "#ffffff",
    boxShadow: "inset 0 1px 2px rgba(15,23,42,0.03)",
    padding: multiline ? "12px 14px" : "0 14px",
    fontSize: 14,
    color: "#0f172a",
    outline: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
    resize: multiline ? "vertical" : "none",
    boxSizing: "border-box",
  };
}

export function CreateCustomerView({ currentUserRole, onBack }: CreateCustomerViewProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isPending, startTransition] = useTransition();

  const passwordChecklist = useMemo(
    () => [
      { label: "8+ characters", valid: form.password.length >= 8 },
      { label: "Upper and lowercase", valid: /[A-Z]/.test(form.password) && /[a-z]/.test(form.password) },
      { label: "Number or symbol", valid: /[\d!@#$%^&*(),.?\":{}|<>]/.test(form.password) },
      { label: "Passwords match", valid: !!form.password && form.password === form.confirmPassword },
    ],
    [form.password, form.confirmPassword]
  );

  const updateField = (key: keyof CreateCustomerFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
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

  const canSubmit = passwordChecklist.every((item) => item.valid);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", minHeight: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          padding: "18px 20px",
          borderRadius: 18,
          border: "1px solid #dbe5ef",
          background:
            "linear-gradient(135deg, rgba(18,62,103,0.98) 0%, rgba(17,84,138,0.95) 65%, rgba(240,83,35,0.92) 100%)",
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
            Provision a customer portal account inside your dashboard. Sensitive credentials stay server-side and are stored
            with bcrypt salting and hashing before persistence.
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.6fr) minmax(280px, 0.9fr)",
          gap: 16,
          flex: 1,
          minHeight: 0,
        }}
      >
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
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Primary contact</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Identity and login information for the customer owner.</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
              <FieldBlock label="Full name">
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  placeholder="e.g. Toby Schultz"
                  autoComplete="name"
                  required
                  style={inputStyle()}
                />
              </FieldBlock>

              <FieldBlock label="Email address">
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="client@brand.com"
                  autoComplete="email"
                  required
                  style={inputStyle()}
                />
              </FieldBlock>

              <FieldBlock label="Phone number">
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="(555) 555-5555"
                  autoComplete="tel"
                  style={inputStyle()}
                />
              </FieldBlock>

              <FieldBlock label="Jira / external ID" hint="Optional internal mapping key if this customer already exists elsewhere.">
                <input
                  value={form.jiraId}
                  onChange={(event) => updateField("jiraId", event.target.value)}
                  placeholder="CUS-1001"
                  style={inputStyle()}
                />
              </FieldBlock>
            </div>
          </div>

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
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Company profile</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Business information used across the dashboard and future records.</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
              <FieldBlock label="Company name">
                <input
                  value={form.companyName}
                  onChange={(event) => updateField("companyName", event.target.value)}
                  placeholder="Next Day Nutra Client LLC"
                  required
                  style={inputStyle()}
                />
              </FieldBlock>

              <FieldBlock label="Portal redirect">
                <input
                  value={form.redirectUrl}
                  onChange={(event) => updateField("redirectUrl", event.target.value)}
                  placeholder="/"
                  style={inputStyle()}
                />
              </FieldBlock>

              <FieldBlock label="Additional access flags" hint="Comma-separated internal flags if needed.">
                <input
                  value={form.additionalAccess}
                  onChange={(event) => updateField("additionalAccess", event.target.value)}
                  placeholder="priority_support, beta_portal"
                  style={inputStyle()}
                />
              </FieldBlock>
            </div>
          </div>

          <div style={{ padding: 20, borderRadius: 18, border: "1px solid #e2e8f0", background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: "#eefaf1",
                  color: "#15803d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <KeyRound size={18} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Secure access</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Passwords are validated here and only hashed on the server.</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
              <FieldBlock label="Temporary password">
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    required
                    style={inputStyle()}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const password = generatePassword();
                      setForm((prev) => ({ ...prev, password, confirmPassword: password }));
                    }}
                    style={{
                      height: 44,
                      padding: "0 14px",
                      borderRadius: 12,
                      border: "1px solid #cfd9e4",
                      background: "#f8fafc",
                      color: "#123e67",
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Generate
                  </button>
                </div>
              </FieldBlock>

              <FieldBlock label="Confirm password">
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) => updateField("confirmPassword", event.target.value)}
                  autoComplete="new-password"
                  placeholder="Repeat the password"
                  required
                  style={inputStyle()}
                />
              </FieldBlock>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 14 }}>
              {passwordChecklist.map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    minHeight: 38,
                    borderRadius: 12,
                    padding: "0 12px",
                    background: item.valid ? "#effaf3" : "#f8fafc",
                    border: `1px solid ${item.valid ? "#b7e4c7" : "#e2e8f0"}`,
                    color: item.valid ? "#166534" : "#64748b",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <BadgeCheck size={14} />
                  {item.label}
                </div>
              ))}
            </div>

            <input
              tabIndex={-1}
              autoComplete="off"
              value={form.botField}
              onChange={(event) => updateField("botField", event.target.value)}
              aria-hidden="true"
              style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
            />
          </div>

          <div style={{ padding: 20, borderRadius: 18, border: "1px solid #e2e8f0", background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: "#f5f7fb",
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MapPin size={18} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Address details</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>Optional billing or shipping profile for the account record.</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
              <FieldBlock label="Address line 1">
                <input
                  value={form.addressLine1}
                  onChange={(event) => updateField("addressLine1", event.target.value)}
                  autoComplete="address-line1"
                  style={inputStyle()}
                />
              </FieldBlock>
              <FieldBlock label="Address line 2">
                <input
                  value={form.addressLine2}
                  onChange={(event) => updateField("addressLine2", event.target.value)}
                  autoComplete="address-line2"
                  style={inputStyle()}
                />
              </FieldBlock>
              <FieldBlock label="City">
                <input value={form.city} onChange={(event) => updateField("city", event.target.value)} autoComplete="address-level2" style={inputStyle()} />
              </FieldBlock>
              <FieldBlock label="State">
                <input value={form.state} onChange={(event) => updateField("state", event.target.value)} autoComplete="address-level1" style={inputStyle()} />
              </FieldBlock>
              <FieldBlock label="ZIP / postal code">
                <input value={form.zip} onChange={(event) => updateField("zip", event.target.value)} autoComplete="postal-code" style={inputStyle()} />
              </FieldBlock>
              <FieldBlock label="Country">
                <input value={form.country} onChange={(event) => updateField("country", event.target.value)} autoComplete="country-name" style={inputStyle()} />
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

        <aside style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ padding: 20, borderRadius: 18, border: "1px solid #e2e8f0", background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <ShieldCheck size={18} color="#123e67" />
              <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>Security notes</div>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                "Server-side Zod validation rejects malformed payloads.",
                "Passwords are salted and hashed with bcrypt before storage.",
                "The role is forced to customer on the backend, not trusted from the browser.",
                "A hidden honeypot field helps drop basic bot submissions.",
                "Only authenticated staff roles can submit this form.",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    borderRadius: 12,
                    border: "1px solid #e8eef5",
                    background: "#f8fafc",
                    padding: "12px 14px",
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: "#334155",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 20, borderRadius: 18, border: "1px solid #e2e8f0", background: "#fff" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 14 }}>Provisioning summary</div>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                { icon: <UserRound size={15} />, label: "Portal role", value: "customer" },
                { icon: <Mail size={15} />, label: "Contact email", value: form.email || "Not entered yet" },
                { icon: <Building2 size={15} />, label: "Company", value: form.companyName || "Not entered yet" },
                { icon: <Phone size={15} />, label: "Phone", value: form.phone || "Optional" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "24px 1fr",
                    gap: 10,
                    alignItems: "start",
                    fontSize: 13,
                  }}
                >
                  <div style={{ color: "#123e67", marginTop: 1 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#123e67" }}>{item.label}</div>
                    <div style={{ color: "#475569", marginTop: 2, wordBreak: "break-word" }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: 20,
              borderRadius: 18,
              border: "1px solid #e2e8f0",
              background: "linear-gradient(180deg, #fff7ed 0%, #ffffff 100%)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: "#f05323", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Current operator
            </div>
            <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{currentUserRole || "Unknown role"}</div>
            <p style={{ margin: "10px 0 0", fontSize: 12, lineHeight: 1.6, color: "#64748b" }}>
              Access to this form should be limited to staff roles such as manager, admin, or super admin.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
