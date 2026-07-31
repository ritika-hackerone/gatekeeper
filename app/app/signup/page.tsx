"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { googleLoginUrl, signup } from "../../lib/auth";
import Tilt from "../components/Tilt";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, fullName);
      router.push("/apply");
    } catch (err: any) {
      setError(err.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <Link
        href="/"
        style={{
          position: "absolute",
          top: 20,
          left: 24,
          fontSize: 13,
          color: "var(--text-secondary)",
          textDecoration: "none",
          zIndex: 2,
        }}
      >
        ← Back to Gatekeeper
      </Link>
      <Tilt maxTilt={5}>
      <div className="auth-card step-fade">
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "var(--brand)",
              margin: "0 auto 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            A
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 4px" }}>Create your account</h1>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>Start your visa readiness check</p>
        </div>

        <a href={googleLoginUrl()} className="google-btn">
          <GoogleIcon /> Continue with Google
        </a>

        <div className="divider-row">or sign up with email</div>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ marginBottom: 14 }} />

          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 14 }} />

          <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginBottom: 6 }}
          />
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 16px" }}>At least 8 characters.</p>

          {error && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-secondary)", marginTop: 18 }}>
          Already have an account?{" "}
          <Link href="/signin" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
      </Tilt>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.64v3h3.89c2.28-2.1 3.56-5.2 3.56-8.83z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.89-3c-1.08.73-2.46 1.16-4.06 1.16-3.12 0-5.77-2.11-6.72-4.94H1.27v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.28 14.32A7.2 7.2 0 0 1 4.9 12c0-.8.14-1.58.38-2.32v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.42l4.01-3.1z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.58l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75z" />
    </svg>
  );
}
