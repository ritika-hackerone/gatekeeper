"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { saveToken } from "../../../lib/auth";

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      saveToken(token);
      router.replace("/");
    } else {
      router.replace("/signin");
    }
  }, [params, router]);

  return (
    <div className="auth-shell">
      <p style={{ color: "var(--text-secondary)" }}>Signing you in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="auth-shell" />}>
      <CallbackHandler />
    </Suspense>
  );
}
