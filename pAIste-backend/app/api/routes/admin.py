from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.database import get_session
from app.models.user import User
from app.models.report import Report, Detection
from app.schemas.schemas import ReportOut, ReviewRequest, DetectionResult
from app.services.mcts_service import compute_mcts
from app.core.security import get_current_admin

router = APIRouter()

@router.get("/users")
def get_all_users(
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin),
):
    users = session.exec(select(User).order_by(User.created_at.desc())).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at,
            "is_active": u.is_active
        }
        for u in users
    ]

@router.patch("/change-password")
def change_password(
    data: dict,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin),
):
    from app.core.security import verify_password, hash_password
    if not verify_password(data.get("current_password", ""), admin.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    admin.password_hash = hash_password(data.get("new_password", ""))
    session.add(admin)
    session.commit()
    return {"message": "Password changed successfully"}


def build_report_out(report: Report, session: Session) -> ReportOut:
    detections = session.exec(
        select(Detection).where(Detection.report_id == report.id)
    ).all()
    return ReportOut(
        **report.dict(),
        detections=[DetectionResult(**d.dict()) for d in detections]
    )

@router.get("/reports", response_model=List[ReportOut])
def get_all_reports(
    status: str = None,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin),
):
    """
    Get all reports. Optionally filter by status:
    pending | validated | rejected
    """
    query = select(Report).order_by(Report.created_at.desc())
    if status:
        query = query.where(Report.status == status)
    reports = session.exec(query).all()
    return [build_report_out(r, session) for r in reports]

@router.get("/reports/{report_id}", response_model=ReportOut)
def get_report_detail(
    report_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin),
):
    """Get full details of a single report for review."""
    report = session.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return build_report_out(report, session)

@router.patch("/reports/{report_id}/validate", response_model=ReportOut)
def validate_report(
    report_id: int,
    data: ReviewRequest,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin),
):
    """
    Validate a report — it will appear on the dashboard and map.
    Automatically triggers MCTS score computation.
    """
    report = session.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending reports can be validated")

    report.status = "validated"
    report.admin_remarks = data.admin_remarks
    report.reviewed_by = admin.id
    report.reviewed_at = datetime.utcnow()
    session.add(report)
    session.commit()

    # Compute MCTS score on validation
    compute_mcts(report_id, session)

    session.refresh(report)
    return build_report_out(report, session)

@router.patch("/reports/{report_id}/reject", response_model=ReportOut)
def reject_report(
    report_id: int,
    data: ReviewRequest,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin),
):
    """Reject a report with optional remarks."""
    report = session.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending reports can be rejected")

    report.status = "rejected"
    report.admin_remarks = data.admin_remarks
    report.reviewed_by = admin.id
    report.reviewed_at = datetime.utcnow()
    session.add(report)
    session.commit()
    session.refresh(report)
    return build_report_out(report, session)
