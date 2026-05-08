import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlmodel import Session, select
from supabase import create_client, Client

from app.db.database import get_session
from app.models.user import User
from app.models.report import Report, Detection
from app.schemas.schemas import ReportOut, DetectionResult
from app.services.detection_service import run_detection
from app.core.security import get_current_user
from app.core.config import settings

router = APIRouter()

SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_SERVICE_KEY
SUPABASE_BUCKET = settings.SUPABASE_BUCKET
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def build_report_out(report: Report, session: Session) -> ReportOut:
    detections = session.exec(
        select(Detection).where(Detection.report_id == report.id)
    ).all()
    return ReportOut(
        **report.dict(),
        detections=[DetectionResult(**d.dict()) for d in detections]
    )

@router.get("/", response_model=List[ReportOut])
def get_reports(
    status: Optional[str] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    query = select(Report)
    if status:
        query = query.where(Report.status == status)
    if current_user.role != "admin":
        query = query.where(Report.user_id == current_user.id)
    query = query.order_by(Report.created_at.desc())
    reports = session.exec(query).all()
    return [build_report_out(r, session) for r in reports]

@router.post("/", response_model=ReportOut, status_code=201)
async def submit_report(
    image: UploadFile = File(...),
    gps_lat: float = Form(...),
    gps_lng: float = Form(...),
    location_name: str = Form(None),
    notes: str = Form(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    if not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4()}_{image.filename}"
    image_path = f"{settings.UPLOAD_DIR}/{filename}"

    with open(image_path, "wb") as f:
        shutil.copyfileobj(image.file, f)

    try:
        raw_detections = run_detection(image_path)

        with open(image_path, "rb") as f:
            file_bytes = f.read()

        supabase.storage.from_(SUPABASE_BUCKET).upload(
            file=file_bytes,
            path=image_path,
            file_options={"content-type": image.content_type, "upsert": "false"}
        )

    except Exception as e:
        if os.path.exists(image_path):
            os.remove(image_path)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

    if os.path.exists(image_path):
        os.remove(image_path)

    report = Report(
        user_id=current_user.id,
        image_path=image_path,
        gps_lat=gps_lat,
        gps_lng=gps_lng,
        location_name=location_name,
        notes=notes,
        status="pending",
    )
    session.add(report)
    session.commit()
    session.refresh(report)

    for d in raw_detections:
        detection = Detection(report_id=report.id, **d)
        session.add(detection)
    session.commit()

    return build_report_out(report, session)

@router.get("/me", response_model=List[ReportOut])
def my_reports(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    reports = session.exec(
        select(Report)
        .where(Report.user_id == current_user.id)
        .order_by(Report.created_at.desc())  # ✅ fixed: was submitted_at
    ).all()
    return [build_report_out(r, session) for r in reports]

@router.get("/{report_id}", response_model=ReportOut)
def get_report(
    report_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    report = session.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    return build_report_out(report, session)
