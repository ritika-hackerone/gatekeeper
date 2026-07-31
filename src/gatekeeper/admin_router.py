from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .db import get_db
from .deps import require_admin
from .models import ReportRecord, User

router = APIRouter(prefix="/admin", tags=["admin"])


class AdminUserOut(BaseModel):
    id: str
    email: str
    full_name: str | None
    is_admin: bool
    is_active: bool
    created_at: str

    class Config:
        from_attributes = True


class AdminReportOut(BaseModel):
    id: str
    user_id: str | None
    destination_country: str
    created_at: str
    flag_count: int
    severity_counts: dict


@router.get("/stats")
def stats(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    total_users = db.query(User).count()
    total_reports = db.query(ReportRecord).count()
    return {"total_users": total_users, "total_reports": total_reports}


@router.get("/users", response_model=list[AdminUserOut])
def list_users(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        AdminUserOut(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            is_admin=u.is_admin,
            is_active=u.is_active,
            created_at=u.created_at.isoformat(),
        )
        for u in users
    ]


@router.get("/reports", response_model=list[AdminReportOut])
def list_reports(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    reports = db.query(ReportRecord).order_by(ReportRecord.created_at.desc()).limit(200).all()
    out = []
    for r in reports:
        flags = r.report_json.get("flags", [])
        severity_counts: dict[str, int] = {}
        for f in flags:
            severity_counts[f["severity"]] = severity_counts.get(f["severity"], 0) + 1
        out.append(
            AdminReportOut(
                id=r.id,
                user_id=r.user_id,
                destination_country=r.destination_country,
                created_at=r.created_at.isoformat(),
                flag_count=len(flags),
                severity_counts=severity_counts,
            )
        )
    return out


@router.get("/reports/{report_id}")
def get_report_detail(report_id: str, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    r = db.get(ReportRecord, report_id)
    if not r:
        return {"error": "not found"}
    return r.report_json


@router.post("/users/{user_id}/toggle-admin")
def toggle_admin(user_id: str, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    user = db.get(User, user_id)
    if not user:
        return {"error": "not found"}
    user.is_admin = not user.is_admin
    db.commit()
    return {"id": user.id, "is_admin": user.is_admin}


@router.post("/users/{user_id}/toggle-active")
def toggle_active(user_id: str, db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    user = db.get(User, user_id)
    if not user:
        return {"error": "not found"}
    user.is_active = not user.is_active
    db.commit()
    return {"id": user.id, "is_active": user.is_active}
