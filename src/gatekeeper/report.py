"""
Stages 6-8 — Severity/ordering, report assembly, verify, export.

Never a score on its own, never a verdict. Every report carries the fixed
disclaimer block below, unedited, on every generation.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from io import BytesIO
from typing import Any

from .anchor import guard_report
from .atlas_client import AtlasClient
from .engine import load_rules, run_rules
from .funding import compute_funding_sufficiency
from .schema import ApplicantProfile

DISCLAIMER = (
    "This is a preparation checklist, not a prediction. It does not state, "
    "estimate, or imply the probability of any visa decision. Each item "
    "below points to a specific, published official rule and a concrete "
    "action you can take before you apply. Always check the official page "
    "linked with each item for the current, authoritative wording — rules "
    "change, and this report reflects criteria as last verified by our team."
)


@dataclass
class ReadinessReport:
    report_id: str
    generated_at: str
    destination_country: str
    official_overview_url: str
    funding_summary: dict[str, Any]
    flags: list[dict]
    disclaimer: str
    anchor_verified: bool

    def to_dict(self) -> dict:
        return {
            "report_id": self.report_id,
            "generated_at": self.generated_at,
            "destination_country": self.destination_country,
            "official_overview_url": self.official_overview_url,
            "funding_summary": self.funding_summary,
            "flags": self.flags,
            "disclaimer": self.disclaimer,
            "anchor_verified": self.anchor_verified,
        }


def build_report(profile: ApplicantProfile, atlas_client: AtlasClient | None = None) -> ReadinessReport:
    rules, buffer_pct, overview_url = load_rules(profile.destination_country.value)

    funding_result = compute_funding_sufficiency(profile, buffer_pct, atlas_client)

    context = profile.flatten()
    context.update(funding_result.to_context())

    flags = run_rules(rules, context, funding_shortfall_usd=funding_result.shortfall_usd)
    flag_dicts = [f.to_dict() for f in flags]

    check = guard_report(flag_dicts, DISCLAIMER)  # raises AnchorViolation on failure

    funding_summary = {
        "tuition_usd": funding_result.tuition_usd,
        "living_cost_usd": funding_result.living_cost_usd,
        "buffer_pct": funding_result.buffer_pct,
        "total_required_usd": round(funding_result.total_required_usd, 2),
        "funds_available_usd": funding_result.funds_available_usd,
        "shortfall_usd": round(funding_result.shortfall_usd, 2),
        "sufficient": funding_result.sufficient,
        "cost_data_source": funding_result.cost_data_source,
        "cost_data_as_of": funding_result.cost_data_as_of,
        "cost_data_is_mock": funding_result.cost_data_is_mock,
    }

    return ReadinessReport(
        report_id=str(uuid.uuid4()),
        generated_at=datetime.now(timezone.utc).isoformat(),
        destination_country=profile.destination_country.value,
        official_overview_url=overview_url,
        funding_summary=funding_summary,
        flags=flag_dicts,
        disclaimer=DISCLAIMER,
        anchor_verified=check.passed,
    )


_SEVERITY_LABEL = {"high": "High", "medium": "Medium", "low": "Low"}
_SEVERITY_COLOR = {"high": "#b91c1c", "medium": "#b45309", "low": "#0f766e"}


def render_report_html(report: ReadinessReport) -> str:
    fs = report.funding_summary
    mock_note = (
        '<p style="color:#b45309;font-size:12px;">⚠ Cost data source is a MOCK '
        "placeholder pending P1 Atlas integration — figures are illustrative only.</p>"
        if fs.get("cost_data_is_mock")
        else ""
    )

    rows = ""
    if not report.flags:
        rows = "<p>No flags were raised against the encoded criteria for this destination.</p>"
    else:
        for f in report.flags:
            color = _SEVERITY_COLOR.get(f["severity"], "#374151")
            label = _SEVERITY_LABEL.get(f["severity"], f["severity"])
            rows += f"""
            <div style="border:1px solid #e5e7eb;border-left:6px solid {color};border-radius:6px;
                        padding:14px 16px;margin-bottom:14px;">
              <div style="font-weight:700;color:{color};font-size:12px;letter-spacing:.04em;
                          text-transform:uppercase;margin-bottom:6px;">{label} — {f['rule_id']}</div>
              <p style="margin:0 0 8px 0;">{f['statement']}</p>
              <p style="margin:0 0 8px 0;"><strong>Action:</strong> {f['action']}</p>
              <a href="{f['source_url']}" style="font-size:12px;color:#2563eb;">Official source ↗</a>
            </div>
            """

    html = f"""<!doctype html>
<html><head><meta charset="utf-8"><title>Visa Readiness Report</title>
<style>
body {{ font-family: -apple-system, Arial, sans-serif; color:#111827; max-width:760px; margin:32px auto; padding:0 20px; }}
h1 {{ font-size:22px; }}
h2 {{ font-size:16px; margin-top:28px; border-bottom:2px solid #0f766e; padding-bottom:6px; }}
table {{ width:100%; border-collapse:collapse; font-size:14px; }}
td, th {{ border:1px solid #e5e7eb; padding:8px 10px; text-align:left; }}
.disclaimer {{ background:#f0fdfa; border:1px solid #99f6e4; border-radius:8px; padding:14px 16px; font-size:13px; }}
</style></head>
<body>
  <h1>Visa Readiness Report</h1>
  <p style="font-size:12px;color:#6b7280;">Report ID: {report.report_id} · Generated: {report.generated_at}</p>
  <div class="disclaimer">{report.disclaimer}</div>

  <h2>Funding Summary</h2>
  {mock_note}
  <table>
    <tr><th>Tuition (annual, USD)</th><td>{fs['tuition_usd']:,.2f}</td></tr>
    <tr><th>Living cost (annual, USD)</th><td>{fs['living_cost_usd']:,.2f}</td></tr>
    <tr><th>Buffer applied</th><td>{fs['buffer_pct']*100:.0f}%</td></tr>
    <tr><th>Total required (USD)</th><td>{fs['total_required_usd']:,.2f}</td></tr>
    <tr><th>Funds available (USD)</th><td>{fs['funds_available_usd']:,.2f}</td></tr>
    <tr><th>Shortfall (USD)</th><td>{fs['shortfall_usd']:,.2f}</td></tr>
    <tr><th>Cost data source</th><td>{fs['cost_data_source']} (as of {fs['cost_data_as_of']})</td></tr>
  </table>

  <h2>Flags ({len(report.flags)})</h2>
  {rows}

  <h2>Official Overview</h2>
  <p><a href="{report.official_overview_url}">{report.official_overview_url}</a></p>
</body></html>"""
    return html


def render_report_pdf(report: ReadinessReport) -> bytes:
    """Renders the HTML report to PDF. Tries WeasyPrint first (per 5.5 tools
    table); falls back to a plain reportlab render if WeasyPrint's system
    deps (pango/cairo) aren't installed in this environment, so the pipeline
    stays runnable everywhere."""
    html = render_report_html(report)
    try:
        from weasyprint import HTML  # type: ignore

        return HTML(string=html).write_pdf()
    except Exception:
        return _fallback_pdf(report)


def _fallback_pdf(report: ReadinessReport) -> bytes:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter, topMargin=0.7 * inch, bottomMargin=0.7 * inch)
    styles = getSampleStyleSheet()
    flag_style = ParagraphStyle("flag", parent=styles["BodyText"], spaceAfter=10)

    story = [
        Paragraph("Visa Readiness Report", styles["Title"]),
        Paragraph(f"Report ID: {report.report_id} — Generated: {report.generated_at}", styles["Normal"]),
        Spacer(1, 10),
        Paragraph(report.disclaimer, styles["Italic"]),
        Spacer(1, 14),
        Paragraph("Funding Summary", styles["Heading2"]),
    ]
    fs = report.funding_summary
    for label, key, fmt in [
        ("Tuition (annual, USD)", "tuition_usd", ",.2f"),
        ("Living cost (annual, USD)", "living_cost_usd", ",.2f"),
        ("Total required (USD)", "total_required_usd", ",.2f"),
        ("Funds available (USD)", "funds_available_usd", ",.2f"),
        ("Shortfall (USD)", "shortfall_usd", ",.2f"),
    ]:
        story.append(Paragraph(f"{label}: {format(fs[key], fmt)}", styles["Normal"]))

    story.append(Spacer(1, 14))
    story.append(Paragraph(f"Flags ({len(report.flags)})", styles["Heading2"]))
    if not report.flags:
        story.append(Paragraph("No flags were raised against the encoded criteria.", styles["Normal"]))
    for f in report.flags:
        story.append(
            Paragraph(
                f"<b>[{f['severity'].upper()}] {f['rule_id']}</b><br/>{f['statement']}<br/>"
                f"<b>Action:</b> {f['action']}<br/><font size=8>{f['source_url']}</font>",
                flag_style,
            )
        )

    doc.build(story)
    return buf.getvalue()
