"""
FastAPI app. Run with:  uvicorn gatekeeper.main:app --reload --port 8000

Endpoints:
  POST /intake            -> validate profile, run pipeline, persist + return report JSON
                              (works anonymously; attaches to the logged-in user if a
                              valid Bearer token is sent, so history shows on /admin)
  GET  /report/{id}       -> fetch a previously generated report (JSON)
  GET  /report/{id}/pdf   -> fetch a previously generated report (PDF)
  GET  /healthz           -> liveness check
  /auth/*                 -> signup, login, forgot/reset password, Google OAuth (auth_router.py)
  /admin/*                -> admin-only stats/users/reports (admin_router.py)
"""
from __future__ import annotations

import os

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import ValidationError
from sqlalchemy.orm import Session

from .admin_router import router as admin_router
from .anchor import AnchorViolation
from .auth_router import router as auth_router
from .db import get_db, init_db
from .deps import get_current_user_optional
from .models import ReportRecord, User
from .report import build_report, render_report_pdf
from .schema import ApplicantProfile

app = FastAPI(title="P3 Gatekeeper", version="0.2.0")

FRONTEND_ORIGINS = os.environ.get("FRONTEND_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.post("/intake")
def intake(
    payload: dict,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_current_user_optional),
):
    try:
        profile = ApplicantProfile(**payload)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors())

    try:
        report = build_report(profile)
    except AnchorViolation as e:
        # A report that fails its own citation/no-verdict guard must never
        # reach a user — surfaced as a 500, not silently patched.
        raise HTTPException(status_code=500, detail=f"Report failed verification: {e}")

    record = ReportRecord(
        id=report.report_id,
        user_id=user.id if user else None,
        destination_country=report.destination_country,
        payload_json=payload,
        report_json=report.to_dict(),
    )
    db.add(record)
    db.commit()

    return report.to_dict()


@app.get("/report/{report_id}")
def get_report(report_id: str, db: Session = Depends(get_db)):
    record = db.get(ReportRecord, report_id)
    if not record:
        raise HTTPException(status_code=404, detail="Report not found")
    return record.report_json


@app.get("/report/{report_id}/pdf")
def get_report_pdf(report_id: str, db: Session = Depends(get_db)):
    record = db.get(ReportRecord, report_id)
    if not record:
        raise HTTPException(status_code=404, detail="Report not found")

    # Rebuild the ReadinessReport dataclass shape render_report_pdf expects
    # from the stored dict, rather than re-running the whole pipeline.
    from .report import ReadinessReport

    r = record.report_json
    report = ReadinessReport(
        report_id=r["report_id"],
        generated_at=r["generated_at"],
        destination_country=r["destination_country"],
        official_overview_url=r["official_overview_url"],
        funding_summary=r["funding_summary"],
        flags=r["flags"],
        disclaimer=r["disclaimer"],
        anchor_verified=r["anchor_verified"],
    )
    pdf_bytes = render_report_pdf(report)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="visa-readiness-{report_id}.pdf"'},
    )


@app.get("/me/reports")
def my_reports(db: Session = Depends(get_db), user: User = Depends(get_current_user_optional)):
    if not user:
        raise HTTPException(status_code=401, detail="Login required")
    records = (
        db.query(ReportRecord)
        .filter(ReportRecord.user_id == user.id)
        .order_by(ReportRecord.created_at.desc())
        .all()
    )
    return [
        {
            "report_id": r.id,
            "destination_country": r.destination_country,
            "created_at": r.created_at.isoformat(),
            "flag_count": len(r.report_json.get("flags", [])),
        }
        for r in records
    ]
