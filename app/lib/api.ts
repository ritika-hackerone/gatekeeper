export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

export type Flag = {
  rule_id: string;
  statement: string;
  source_url: string;
  severity: "high" | "medium" | "low";
  action: string;
};

export type FundingSummary = {
  tuition_usd: number;
  living_cost_usd: number;
  buffer_pct: number;
  total_required_usd: number;
  funds_available_usd: number;
  shortfall_usd: number;
  sufficient: boolean;
  cost_data_source: string;
  cost_data_as_of: string;
  cost_data_is_mock: boolean;
};

export type ReadinessReport = {
  report_id: string;
  generated_at: string;
  destination_country: string;
  official_overview_url: string;
  funding_summary: FundingSummary;
  flags: Flag[];
  disclaimer: string;
  anchor_verified: boolean;
};

export async function submitIntake(payload: unknown): Promise<ReadinessReport> {
  const { authHeader } = await import("./auth");
  const res = await fetch(`${API_BASE}/intake`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail ? JSON.stringify(detail.detail) : `Request failed (${res.status})`);
  }
  return res.json();
}

export async function fetchReport(reportId: string): Promise<ReadinessReport> {
  const res = await fetch(`${API_BASE}/report/${reportId}`);
  if (!res.ok) throw new Error(`Report not found (${res.status})`);
  return res.json();
}

export function pdfUrl(reportId: string): string {
  return `${API_BASE}/report/${reportId}/pdf`;
}
