"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "../../lib/api";
import { authHeader, fetchMe, MeResponse } from "../../lib/auth";
import Header from "../components/Header";
import Tilt from "../components/Tilt";

type Stats = { total_users: number; total_reports: number };
type AdminUser = { id: string; email: string; full_name: string | null; is_admin: boolean; is_active: boolean; created_at: string };
type AdminReport = {
  id: string;
  user_id: string | null;
  destination_country: string;
  created_at: string;
  flag_count: number;
  severity_counts: Record<string, number>;
};

async function adminFetch(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { headers: authHeader() });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

export default function AdminPage() {
  const [me, setMe] = useState<MeResponse | null | undefined>(undefined);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [tab, setTab] = useState<"reports" | "users">("reports");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe().then(setMe);
  }, []);

  useEffect(() => {
    if (me === undefined) return;
    if (!me || !me.is_admin) return;
    Promise.all([adminFetch("/admin/stats"), adminFetch("/admin/users"), adminFetch("/admin/reports")])
      .then(([s, u, r]) => {
        setStats(s);
        setUsers(u);
        setReports(r);
      })
      .catch((e) => setError(e.message));
  }, [me]);

  if (me === undefined) return null;

  if (!me || !me.is_admin) {
    return (
      <>
        <Header active="" />
        <main style={{ maxWidth: 480, margin: "60px auto", textAlign: "center", padding: "0 20px" }}>
          <h1 style={{ fontSize: 18 }}>Admin access required</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            You need an administrator account to view this page.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header active="" />
      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px 60px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Admin dashboard</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 24 }}>
          Signed in as {me.email}
        </p>

        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

        <div className="metrics-grid step-fade" style={{ marginBottom: 28, gridTemplateColumns: "1fr 1fr" }}>
          <Tilt maxTilt={6}>
            <div className="card" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Total users</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "var(--brand)" }}>{stats?.total_users ?? "—"}</div>
            </div>
          </Tilt>
          <Tilt maxTilt={6}>
            <div className="card" style={{ padding: "16px 20px" }}>
              <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Total reports</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "var(--brand)" }}>{stats?.total_reports ?? "—"}</div>
            </div>
          </Tilt>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            className={tab === "reports" ? "btn-primary" : "btn-secondary"}
            style={{ fontSize: 13 }}
            onClick={() => setTab("reports")}
          >
            Reports
          </button>
          <button
            className={tab === "users" ? "btn-primary" : "btn-secondary"}
            style={{ fontSize: 13 }}
            onClick={() => setTab("users")}
          >
            Users
          </button>
        </div>

        {tab === "reports" && (
          <div className="card step-fade" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                  <th style={th}>Destination</th>
                  <th style={th}>Flags</th>
                  <th style={th}>Created</th>
                  <th style={th}>Report ID</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={td}>{r.destination_country}</td>
                    <td style={td}>
                      {r.flag_count}{" "}
                      {Object.entries(r.severity_counts).map(([sev, count]) => (
                        <span key={sev} style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 6 }}>
                          {sev}:{count}
                        </span>
                      ))}
                    </td>
                    <td style={td}>{new Date(r.created_at).toLocaleString()}</td>
                    <td style={{ ...td, fontFamily: "monospace", fontSize: 11 }}>{r.id}</td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td style={td} colSpan={4}>
                      No reports yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "users" && (
          <div className="card step-fade" style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--surface-muted)", textAlign: "left" }}>
                  <th style={th}>Email</th>
                  <th style={th}>Name</th>
                  <th style={th}>Admin</th>
                  <th style={th}>Active</th>
                  <th style={th}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={td}>{u.email}</td>
                    <td style={td}>{u.full_name || "—"}</td>
                    <td style={td}>{u.is_admin ? "Yes" : "No"}</td>
                    <td style={td}>{u.is_active ? "Yes" : "No"}</td>
                    <td style={td}>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

const th: React.CSSProperties = { padding: "10px 14px", fontWeight: 600, fontSize: 12, color: "var(--text-secondary)" };
const td: React.CSSProperties = { padding: "10px 14px" };
