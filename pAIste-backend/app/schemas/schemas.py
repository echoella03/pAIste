from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ── Auth ──────────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str

# ── User ──────────────────────────────────────────
class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

# ── Detection ─────────────────────────────────────
class DetectionResult(BaseModel):
    species_name: str
    confidence_score: float
    bbox_data: Optional[str] = None
    yolo_label: Optional[str] = None
    cnn_label: Optional[str] = None

class IdentifyResponse(BaseModel):
    detections: List[DetectionResult]
    annotated_image: Optional[str] = None  # base64 encoded
    message: str = "Identification complete"

# ── Report ────────────────────────────────────────
class ReportCreate(BaseModel):
    gps_lat: float
    gps_lng: float
    location_name: Optional[str] = None
    notes: Optional[str] = None

class ReportOut(BaseModel):
    id: int
    user_id: int
    image_path: str
    gps_lat: float
    gps_lng: float
    location_source: str = "manual"
    location_name: Optional[str]
    notes: Optional[str]
    status: str
    admin_remarks: Optional[str]
    submitted_at: datetime
    reviewed_at: Optional[datetime]
    detections: List[DetectionResult] = []
    
# ── Admin ─────────────────────────────────────────
class ReviewRequest(BaseModel):
    status: str  # "validated" or "rejected"
    admin_remarks: Optional[str] = None

# ── MCTS ──────────────────────────────────────────
class MCTSOut(BaseModel):
    report_id: int
    total_score: float
    ecological_impact: float
    spread_rate: float
    detection_frequency: float
    threat_level: str

# ── Dashboard ─────────────────────────────────────
class DashboardStats(BaseModel):
    total_reports: int
    pending_reports: int
    validated_reports: int
    rejected_reports: int
    total_species_detected: int
    top_species: List[dict]
    recent_detections: List[dict]

# ── Map ───────────────────────────────────────────
class MapPoint(BaseModel):
    report_id: int
    gps_lat: float
    gps_lng: float
    location_name: Optional[str]
    species_name: str
    threat_level: Optional[str]
    status: str
    detected_at: datetime