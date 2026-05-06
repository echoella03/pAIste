from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from collections import Counter
from app.db.database import get_session
from app.models.user import User
from app.models.report import Report, Detection, MCTSScore
from app.schemas.schemas import DashboardStats, MCTSOut
from app.core.security import get_current_admin

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin),
):
    """Returns aggregated stats for the admin dashboard."""
    total     = session.exec(select(func.count(Report.id))).one()
    pending   = session.exec(select(func.count(Report.id)).where(Report.status == "pending")).one()
    validated = session.exec(select(func.count(Report.id)).where(Report.status == "validated")).one()
    rejected  = session.exec(select(func.count(Report.id)).where(Report.status == "rejected")).one()

    # Species from validated reports only
    validated_reports = session.exec(
        select(Report).where(Report.status == "validated")
    ).all()
    validated_ids = [r.id for r in validated_reports]

    detections = session.exec(
        select(Detection).where(Detection.report_id.in_(validated_ids))
    ).all() if validated_ids else []

    species_counter = Counter(d.species_name for d in detections)
    unique_species  = len(species_counter)
    top_species     = [
        {"species_name": name, "count": count}
        for name, count in species_counter.most_common(5)
    ]

    # Recent 5 validated detections
    recent_reports = session.exec(
        select(Report)
        .where(Report.status == "validated")
        .order_by(Report.reviewed_at.desc())
        .limit(5)
    ).all()

    recent_detections = []
    for r in recent_reports:
        d = session.exec(
            select(Detection).where(Detection.report_id == r.id).limit(1)
        ).first()
        if d:
            recent_detections.append({
                "report_id":    r.id,
                "species_name": d.species_name,
                "location_name": r.location_name,
                "reviewed_at":  r.reviewed_at.isoformat() if r.reviewed_at else None,
            })

    return DashboardStats(
        total_reports=total,
        pending_reports=pending,
        validated_reports=validated,
        rejected_reports=rejected,
        total_species_detected=unique_species,
        top_species=top_species,
        recent_detections=recent_detections,
    )

@router.get("/mcts", response_model=List[MCTSOut])
def get_mcts_scores(
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin),
):
    """Returns MCTS threat scores for all validated reports."""
    scores = session.exec(
        select(MCTSScore).order_by(MCTSScore.total_score.desc())
    ).all()
    return scores