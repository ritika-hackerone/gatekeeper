"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchMe, logout, MeResponse } from "../../lib/auth";

export default function Header({ active = "readiness" }: { active?: string }) {
  const [me, setMe] = useState<MeResponse | null | undefined>(undefined);

  useEffect(() => {
    fetchMe().then(setMe);
  }, []);

  const navItems = [
    { key: "home", label: "Home", href: "/" },
    { key: "readiness", label: "Visa readiness", href: "/apply" },
    { key: "how", label: "How it works", href: "/#how-it-works" },
  ];

  return (
    <header className="site-header">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          {/* Replace /public/logo.svg with the real AbroBot.ai logo */}
          <Image src="/logo.svg" alt="AbroBot.ai logo" width={32} height={32} />
          <span style={{ fontWeight: 600, fontSize: 16, color: "var(--text-primary)" }}>
            AbroBot<span style={{ color: "var(--brand)" }}>.ai</span>
          </span>
        </Link>
      </div>

      <nav className="site-nav">
        {navItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            style={{
              color: item.key === active ? "var(--brand)" : "var(--text-secondary)",
              fontWeight: item.key === active ? 600 : 400,
              textDecoration: "none",
              fontSize: 13,
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {me === undefined ? null : me ? (
          <>
            {me.is_admin && (
              <Link href="/admin" style={{ fontSize: 13, color: "var(--brand)", textDecoration: "none", fontWeight: 600 }}>
                Admin
              </Link>
            )}
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }} className="hide-on-mobile">
              {me.full_name || me.email}
            </span>
            <button
              className="btn-secondary"
              style={{ padding: "6px 14px", fontSize: 13 }}
              onClick={() => {
                logout();
                window.location.href = "/";
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/signin" style={{ fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}>
              Sign in
            </Link>
            <Link href="/signup" className="btn-primary" style={{ padding: "7px 16px", fontSize: 13, textDecoration: "none" }}>
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
