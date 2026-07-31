"use client";

import { useEffect, useState } from "react";
import { fetchReport, pdfUrl, ReadinessReport } from "../../../lib/api";
import { IconArrowRight, IconCheck } from "../../../lib/icons";
import Header from "../../components/Header";

const severityColor: Record<string, string> = { high: "#b91c1c", medium: "#b45309", low: "#0f6e56" };
const severityBg: Record<string, string> = { high: "#fef2f2", medium: "#fffbeb", low: "#e1f5ee" };

export default function ReportPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<ReadinessReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport(params.id)
      .then(setReport)
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error)
    return (
      <>
        <Header active="readiness" />
        <main style={{ padding: 32, maxWidth: 640, margin: "0 auto" }}>Error: {error}</main>
      </>
    );
  if (!report)
    return (
      <>
        <Header active="readiness" />
        <main style={{ padding: 32, maxWidth: 640, margin: "0 auto", color: "var(--text-secondary)" }}>
          Loading your report…
        </main>
      </>
    );

  const fs = report.funding_summary;

  return (
    <>
      <Header active="readiness" />
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px 60px" }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--brand)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            margin: "0 0 6px",
          }}
        >
          Readiness report
        </p>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: "0 0 4px" }}>Your visa readiness results</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "0 0 20px" }}>
          Report ID: {report.report_id} · Generated: {new Date(report.generated_at).toLocaleString()}
        </p>

        <div
          className="step-fade"
          style={{
            background: "var(--brand-light)",
            border: "1px solid #99e6cf",
            borderRadius: 10,
            padding: "14px 16px",
            fontSize: 13,
            color: "var(--brand-dark)",
            marginBottom: 24,
          }}
        >
          {report.disclaimer}
        </div>

        <section className="card step-fade" style={{ padding: "18px 20px", marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>Funding summary</h2>
          {fs.cost_data_is_mock && (
            <p style={{ color: "var(--warning)", fontSize: 12, marginBottom: 10 }}>
              Cost data source is a mock placeholder pending P1 Atlas integration — figures are illustrative only.
            </p>
          )}
          <div className="metrics-grid">
            {[
              ["Tuition (annual)", `$${fs.tuition_usd.toLocaleString()}`],
              ["Living cost (annual)", `$${fs.living_cost_usd.toLocaleString()}`],
              ["Buffer applied", `${(fs.buffer_pct * 100).toFixed(0)}%`],
              ["Total required", `$${fs.total_required_usd.toLocaleString()}`],
              ["Funds available", `$${fs.funds_available_usd.toLocaleString()}`],
              ["Shortfall", `$${fs.shortfall_usd.toLocaleString()}`],
            ].map(([lbl, val]) => (
              <div key={lbl} style={{ background: "var(--surface-muted)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 2 }}>{lbl}</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{val}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>Flags ({report.flags.length})</h2>
          {report.flags.length === 0 && (
            <div className="card step-fade" style={{ padding: "20px", display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "var(--brand-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconCheck size={15} color="var(--brand-dark)" />
              </div>
              <p style={{ margin: 0, fontSize: 14 }}>No flags were raised against the encoded criteria for this destination.</p>
            </div>
          )}
          {report.flags.map((f) => (
            <div
              key={f.rule_id}
              className="flag-card"
              style={{ borderLeft: `4px solid ${severityColor[f.severity]}` }}
            >
              <div
                style={{
                  display: "inline-block",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.03em",
                  textTransform: "uppercase",
                  color: severityColor[f.severity],
                  background: severityBg[f.severity],
                  padding: "2px 8px",
                  borderRadius: 5,
                  marginBottom: 8,
                }}
              >
                {f.severity} · {f.rule_id}
              </div>
              <p style={{ margin: "0 0 8px 0", fontSize: 14 }}>{f.statement}</p>
              <p style={{ margin: "0 0 8px 0", fontSize: 14 }}>
                <strong>Action:</strong> {f.action}
              </p>
              <a href={f.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "var(--brand)" }}>
                Official source ↗
              </a>
            </div>
          ))}
        </section>

        <a
          href={pdfUrl(report.report_id)}
          className="btn-primary"
          style={{ marginTop: 12, textDecoration: "none", width: "fit-content" }}
        >
          Download PDF <IconArrowRight size={16} color="#fff" />
        </a>
      </main>
    </>
  );
}
