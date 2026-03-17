"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Facebook, Instagram, Twitter } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      rememberMe,
      redirect: false,
      callbackUrl,
    });

    setIsSubmitting(false);

    if (!result || result.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(result.url || callbackUrl);
    router.refresh();
  };

  return (
    <main
      className="login-page-main"
      style={{
        height: "100dvh",
        backgroundImage:
          "url('/ndn-shape-blue-left-scaled.png'), radial-gradient(circle at top left, transparent, rgba(24,83,35,0.18) 82%)",
        backgroundRepeat: "no-repeat, no-repeat",
        backgroundPosition: "top left, top left",
        backgroundAttachment: "fixed, scroll",
        backgroundSize: "contain, contain",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "16px",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <section
        className="login-page-section"
        style={{
          width: "100%",
          maxWidth: 980,
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(9, 30, 66, 0.16)",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(320px, 420px)",
        }}
      >
        <div
          className="login-page-hero"
          style={{
            background: "linear-gradient(160deg, #123E67 0%, #1b5f95 55%, #91abcb 100%)",
            color: "#fff",
            padding: "44px 42px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: 540,
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#ffffff",
                borderRadius: 22,
                padding: "14px 18px",
                marginBottom: 24,
                boxShadow: "0 18px 42px rgba(5, 23, 41, 0.16)",
              }}
            >
              <Image
                src="/next_day_nutra.png"
                alt="Next Day Nutra"
                width={180}
                height={52}
                priority
                style={{ width: "180px", height: "auto", display: "block" }}
              />
            </div>
            <h1 className="login-page-hero-title" style={{ margin: 0, fontSize: 46, lineHeight: 1.02, fontWeight: 800 }}>
              Welcome to Next Day Nutra!
            </h1>
            <p
              style={{
                marginTop: 18,
                maxWidth: 460,
                color: "rgba(255,255,255,0.84)",
                fontSize: 16,
                lineHeight: 1.65,
              }}
            >
              America&apos;s only tech-driven, customer-focused supplement manufacturer and distributor.
            </p>
          </div>

          <div
            className="login-page-feature-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 14,
            }}
          >
            {[
              ["Secure Sessions", "Credential login with signed app sessions."],
              ["Local Storage", "Files saved directly under your dashboard app."],
              ["Audit Trail", "Uploads and comments stay linked to users."],
            ].map(([title, copy]) => (
              <div
                key={title}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 18,
                  padding: 16,
                  minHeight: 120,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, lineHeight: 1.55, color: "rgba(255,255,255,0.78)" }}>{copy}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="login-page-form-shell" style={{ padding: "44px 36px", display: "flex", alignItems: "center", background: "#f7f9fc" }}>
          <form onSubmit={handleSubmit} style={{ width: "100%" }}>
            <div style={{ marginBottom: 28 }}>
              <div
                className="login-page-mobile-logo"
                style={{
                  display: "none",
                  marginBottom: 18,
                  position: "relative",
                  overflow: "hidden",
                  width: "fit-content",
                }}
              >
                <Image
                  src="/next_day_nutra.png"
                  alt="Next Day Nutra"
                  width={170}
                  height={48}
                  priority
                  style={{ width: "170px", height: "auto", display: "block" }}
                />
              </div>
              <div
                style={{
                  color: "#F05323",
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Welcome back
              </div>
              <h2 style={{ margin: "10px 0 8px", fontSize: 32, color: "#102a43" }}>Sign in</h2>
              <p style={{ margin: 0, color: "#52667a", lineHeight: 1.6 }}>
                Use your dashboard credentials.
              </p>
            </div>

            <label style={{ display: "block", marginBottom: 18 }}>
              <span style={{ display: "block", marginBottom: 8, color: "#123E67", fontWeight: 700, fontSize: 14 }}>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
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


            <label style={{ display: "block", marginBottom: 18 }}>
              <span style={{ display: "block", marginBottom: 8, color: "#123E67", fontWeight: 700, fontSize: 14 }}>Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
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

            {error && (
              <div
                style={{
                  marginBottom: 18,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "#fff1f0",
                  border: "1px solid #ffc9c5",
                  color: "#9f2d24",
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 18,
                flexWrap: "wrap",
              }}
            >
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#52667a", fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#123E67" }}
                />
                Remember me
              </label>
              <Link href="/forgot-password" style={{ color: "#123E67", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                Lost your password?
              </Link>
            </div>
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
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </section>

      <footer
        className="login-page-footer"
        style={{
          width: "100%",
          maxWidth: 940,
          margin: "14px auto 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 18,
          flexWrap: "wrap",
          color: "#173b61",
          padding: "14px 22px",
          borderRadius: 24,
          background: "rgba(255,255,255,0.78)",
          border: "1px solid rgba(18,62,103,0.1)",
          boxShadow: "0 18px 40px rgba(9, 30, 66, 0.08)",
          backdropFilter: "blur(10px)",
        }}

      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 15, fontWeight: 700 }}>
          <span style={{ color: "#123E67" }}>Support</span>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#fcfcfc",
              borderRadius: 999,
              padding: "6px 12px",
              border: "1px solid rgba(18,62,103,0.1)",
            }}
          >
            <Image
              src="/next_day_nutra.png"
              alt="Next Day Nutra Support"
              width={92}
              height={26}
              style={{ width: "92px", height: "auto", display: "block" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", color: "#6d7b8c", fontSize: 15 }}>
          <span>Need help? Visit</span>
          <a
            href="https://help.nextdaynutra.com/en/"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 116,
              padding: "11px 22px",
              borderRadius: 999,
              background: "#123E67",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 800,
            }}
          >
            Support
          </a>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {[
            { href: "https://facebook.com/nextdaynutra/", label: "Facebook", icon: Facebook },
            { href: "https://twitter.com/nextdaynutra", label: "Twitter", icon: Twitter },
            { href: "https://www.instagram.com/nextdaynutra/", label: "Instagram", icon: Instagram },
          ].map(({ href, label, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 38,
                height: 38,
                borderRadius: 999,
                border: "1px solid rgba(18,62,103,0.18)",
                background: "#ffffff",
                color: "#123E67",
                boxShadow: "0 8px 18px rgba(18,62,103,0.08)",
              }}
            >
              <Icon size={18} />
            </a>
          ))}
        </div>
      </footer>

      <style jsx>{`
        @media (max-width: 900px) {
          .login-page-main {
            background-image: radial-gradient(circle at top left, transparent, rgba(24, 83, 35, 0.12) 82%) !important;
            background-size: cover !important;
            padding: 20px 16px !important;
            overflow: auto !important;
          }

          .login-page-section {
            grid-template-columns: minmax(0, 1fr) !important;
            max-width: 460px !important;
          }

          .login-page-hero {
            display: none !important;
          }

          .login-page-form-shell {
            padding: 36px 24px !important;
          }

          .login-page-mobile-logo {
            display: block !important;
          }

          .login-page-mobile-logo::after {
            content: "";
            position: absolute;
            top: -20%;
            left: -40%;
            width: 32%;
            height: 140%;
            background: linear-gradient(
              115deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.2) 35%,
              rgba(255, 255, 255, 0.9) 50%,
              rgba(255, 255, 255, 0.2) 65%,
              rgba(255, 255, 255, 0) 100%
            );
            transform: skewX(-22deg);
            animation: mobileLogoShine 2.8s ease-in-out infinite;
            pointer-events: none;
          }
        }

        @keyframes mobileLogoShine {
          0% {
            left: -40%;
          }

          55%,
          100% {
            left: 118%;
          }
        }
      `}</style>
    </main>
  );
}
