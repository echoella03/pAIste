from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime

class Report(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    image_path: str
    gps_lat: float
    gps_lng: float
    location_name: Optional[str] = None
    # Add this line below 
    location_source: str = Field(default="manual") # "auto" or "manual"
    notes: Optional[str] = None
    status: str = Field(default="pending") # "pending", "validated", "rejected"
    admin_remarks: Optional[str] = None
    reviewed_by: Optional[int] = Field(default=None, foreign_key="user.id")
    submitted_at: datetime = Field(default_factory=datetime.utcnow)
    reviewed_at: Optional[datetime] = None

class Detection(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    report_id: Optional[int] = Field(default=None, foreign_key="report.id")
    species_id: Optional[int] = Field(default=None, foreign_key="species.id")
    species_name: str
    confidence_score: float
    bbox_data: Optional[str] = None
    yolo_label: Optional[str] = None
    cnn_label: Optional[str] = None
    detected_at: datetime = Field(default_factory=datetime.utcnow)

class MCTSScore(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    report_id: int = Field(foreign_key="report.id")
    total_score: float
    ecological_impact: float
    spread_rate: float
    detection_frequency: float
    threat_level: str
    computed_at: datetime = Field(default_factory=datetime.utcnow)