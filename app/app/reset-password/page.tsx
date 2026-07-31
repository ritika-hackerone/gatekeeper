"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { resetPassword } from "../../lib/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/signin"), 1800);
    } catch (err: any) {
      setError(err.message || "This reset link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <p style={{ fontSize: 14 }}>
            This reset link is missing a token. Please request a new one from{" "}
            <Link href="/forgot-password" style={{ color: "var(--brand)" }}>
              the forgot password page
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card step-fade">
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 6px" }}>Set a new password</h1>
        {done ? (
          <p style={{ fontSize: 14, background: "var(--brand-light)", padding: "12px 14px", borderRadius: 8 }}>
            Password updated. Redirecting you to sign in…
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: 13, fontWeight: 600, display: "block", margin: "14px 0 4px" }}>New password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={{ marginBottom: 14 }} />

            <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 4 }}>Confirm password</label>
            <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} style={{ marginBottom: 14 }} />

            {error && <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{error}</p>}

            <button className="btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-shell" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
