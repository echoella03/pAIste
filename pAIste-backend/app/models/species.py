from typing import Optional
from sqlmodel import SQLModel, Field

class Species(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    scientific_name: Optional[str] = None
    description: Optional[str] = None
    threat_level: str = Field(default="low")  # "low", "medium", "high", "critical"
    is_invasive: bool = Field(default=True)
    origin: Optional[str] = None
    ecological_impact: Optional[str] = None
    image_url: Optional[str] = None