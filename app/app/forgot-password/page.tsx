"use client";

import Link from "next/link";
import { useState } from "react";
import { forgotPassword } from "../../lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card step-fade">
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 6px" }}>Reset your password</h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" }}>
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {sent ? (
          <p style={{ fontSize: 14, background: "var(--brand-light)", padding: "12px 14px", borderRadius: 8 }}>
            If an account exists for that email, a reset link has been sent. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginBottom: 14 }} />

            {error && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-secondary)", marginTop: 18 }}>
          <Link href="/signin" style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
