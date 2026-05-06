from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.db.database import get_session
from app.models.user import User
from app.models.species import Species
from app.core.security import get_current_user, get_current_admin
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class SpeciesCreate(BaseModel):
    name: str
    scientific_name: Optional[str] = None
    description: Optional[str] = None
    threat_level: str = "medium"
    is_invasive: bool = True
    origin: Optional[str] = None
    ecological_impact: Optional[str] = None
    image_url: Optional[str] = None

class SpeciesUpdate(BaseModel):
    name: Optional[str] = None
    scientific_name: Optional[str] = None
    description: Optional[str] = None
    threat_level: Optional[str] = None
    is_invasive: Optional[bool] = None
    origin: Optional[str] = None
    ecological_impact: Optional[str] = None
    image_url: Optional[str] = None

# ── Public/User endpoints ──────────────────────────────────────────
@router.get("/", response_model=List[Species])
def get_all_species(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """Get all species — accessible by both users and admins."""
    return session.exec(select(Species).order_by(Species.name)).all()

@router.get("/{species_id}", response_model=Species)
def get_species(
    species_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    species = session.get(Species, species_id)
    if not species:
        raise HTTPException(status_code=404, detail="Species not found")
    return species

# ── Admin only endpoints ───────────────────────────────────────────
@router.post("/", response_model=Species, status_code=201)
def create_species(
    data: SpeciesCreate,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin),
):
    existing = session.exec(select(Species).where(Species.name == data.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Species already exists")
    
    species = Species(**data.dict())
    session.add(species)
    session.commit()
    session.refresh(species)
    return species

@router.patch("/{species_id}", response_model=Species)
def update_species(
    species_id: int,
    data: SpeciesUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin),
):
    species = session.get(Species, species_id)
    if not species:
        raise HTTPException(status_code=404, detail="Species not found")
    
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(species, key, value)
    
    session.add(species)
    session.commit()
    session.refresh(species)
    return species

@router.delete("/{species_id}")
def delete_species(
    species_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_admin),
):
    species = session.get(Species, species_id)
    if not species:
        raise HTTPException(status_code=404, detail="Species not found")
    
    session.delete(species)
    session.commit()
    return {"message": f"{species.name} deleted successfully"}