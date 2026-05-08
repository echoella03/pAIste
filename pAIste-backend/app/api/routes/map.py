from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.db.database import get_session
from app.models.user import User
from app.models.report import Report, Detection, MCTSScore
from app.schemas.schemas import MapPoint
from app.core.security import get_current_user

router = APIRouter()

@router.get("/detections", response_model=List[MapPoint])
def get_map_detections(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Returns all validated detections with GPS coordinates for map display.
    Only validated reports appear on the map.
    """
    reports = session.exec(
        select(Report).where(Report.status == "validated")
    ).all()

    points = []
    for report in reports:
        detections = session.exec(
            select(Detection).where(Detection.report_id == report.id)
        ).all()

        if not detections:
            continue

        # Use highest confidence detection as primary
        primary = max(detections, key=lambda d: d.confidence_score)

        # Get MCTS threat level if available
        mcts = session.exec(
            select(MCTSScore).where(MCTSScore.report_id == report.id)
        ).first()

        points.append(MapPoint(
            report_id=report.id,
            gps_lat=report.gps_lat,
            gps_lng=report.gps_lng,
            location_name=report.location_name,
            species_name=primary.species_name,
            threat_level=mcts.threat_level if mcts else None,
            status=report.status,
            detected_at=report.created_at,
        ))

    return points
