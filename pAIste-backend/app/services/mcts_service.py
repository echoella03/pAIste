"""
Multi-Criteria Threat Scoring (MCTS) Service
---------------------------------------------
Formula: TS = SC × ((W1 × S1) + (Wp × Sp) + (Wd × Sd))

Where:
  SC = Confidence Score (AI model reliability, 0.0-1.0)
  S1 = Species Impact Score — derived from species.threat_level in DB
       low=0.25, moderate=0.50, high=0.75, critical=1.0
  Sp = Proximity Score (location vulnerability)
       Protected Area=1.0, Buffer Zone=0.75, Urban=0.50, Agricultural=0.25
  Sd = Density Score (invasion dynamics)
       Single=0.25, Small cluster=0.50, Established=0.75, Widespread=1.0
  W1 = 0.4, Wp = 0.3, Wd = 0.3
"""

from sqlmodel import Session, select, func
from app.models.report import Detection, MCTSScore, Report
from app.models.species import Species

# ── Weights ────────────────────────────────────────────────────────
W1 = 0.4
Wp = 0.3
Wd = 0.3

# ── Species Impact Score — maps DB threat_level to S1 value ───────
# Supports both "moderate" (DB value) and "moderate" (display value)
SPECIES_IMPACT_SCORES = {
    "low":      0.25,
    "moderate":   0.50,   
    "high":     0.75,
    "critical": 1.0,
}

# ── Proximity Score ────────────────────────────────────────────────
PROXIMITY_SCORES = {
    "protected area": 1.0,
    "buffer zone":    0.75,
    "urban":          0.50,
    "agricultural":   0.25,
}

# ── Threat label thresholds ────────────────────────────────────────
# Maps raw TS (0.0-1.0) → threat label stored in DB as "moderate"
def _score_to_threat(ts: float) -> str:
    if ts >= 0.75:
        return "critical"
    elif ts >= 0.50:
        return "high"
    elif ts >= 0.25:
        return "moderate"   
    return "low"


def compute_mcts(report_id: int, session: Session) -> MCTSScore:
    """
    Computes MCTS threat score for a validated report.
    S1 is pulled from species.threat_level in the database.
    """
    # Get detections for this report
    detections = session.exec(
        select(Detection).where(Detection.report_id == report_id)
    ).all()

    if not detections:
        return _save_default_score(report_id, session)

    report = session.get(Report, report_id)
    if not report:
        return _save_default_score(report_id, session)

    # Use highest confidence detection as primary
    primary = max(detections, key=lambda d: d.confidence_score)

    # ── SC: Confidence Score ───────────────────────────────────────
    SC = round(primary.confidence_score, 4)

    # ── S1: Pull species threat_level FROM DATABASE ────────────────
    species = session.exec(
        select(Species).where(Species.name == primary.species_name)
    ).first()

    if species and species.threat_level:
        # Use actual threat level from DB
        db_threat_level = species.threat_level.lower().strip()
        S1 = SPECIES_IMPACT_SCORES.get(db_threat_level, 0.50)
        print(f"📊 Species '{primary.species_name}' → DB threat: '{db_threat_level}' → S1: {S1}")
    else:
        # Fallback if species not found in DB
        S1 = 0.50
        db_threat_level = "moderate"
        print(f"⚠️  Species '{primary.species_name}' not found in DB — using default S1: {S1}")

    # ── Sp: Proximity Score ────────────────────────────────────────
    Sp = _get_proximity_score(report.location_name)

    # ── Sd: Density Score ──────────────────────────────────────────
    validated_count = session.exec(
        select(func.count(Detection.id))
        .join(Report, Report.id == Detection.report_id)
        .where(Detection.species_name == primary.species_name)
        .where(Report.status == "validated")
    ).one()

    Sd = _get_density_score(validated_count)

    # ── Final Score ────────────────────────────────────────────────
    weighted_sum = (W1 * S1) + (Wp * Sp) + (Wd * Sd)
    TS = round(SC * weighted_sum, 4)
    TS_display = round(TS * 10, 2)
    threat_level_label = _score_to_threat(TS)

    print(f"📈 MCTS Report #{report_id}: SC={SC}, S1={S1}, Sp={Sp}, Sd={Sd} → TS={TS_display} ({threat_level_label})")

    # Check if MCTS score already exists for this report
    existing = session.exec(
        select(MCTSScore).where(MCTSScore.report_id == report_id)
    ).first()

    if existing:
        # Update existing score
        existing.total_score = TS_display
        existing.ecological_impact = round(S1, 4)
        existing.spread_rate = round(Sd, 4)
        existing.detection_frequency = round(validated_count * 0.1, 4)
        existing.threat_level = threat_level_label
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    mcts = MCTSScore(
        report_id=report_id,
        total_score=TS_display,
        ecological_impact=round(S1, 4),
        spread_rate=round(Sd, 4),
        detection_frequency=round(validated_count * 0.1, 4),
        threat_level=threat_level_label,
    )

    session.add(mcts)
    session.commit()
    session.refresh(mcts)
    return mcts


def _get_proximity_score(location_name: str) -> float:
    if not location_name:
        return 0.50

    loc = location_name.lower()

    if any(w in loc for w in ['park', 'reserve', 'protected', 'sanctuary', 'forest', 'wildlife', 'conservation', 'natural', 'mt.', 'mount']):
        return PROXIMITY_SCORES["protected area"]

    if any(w in loc for w in ['buffer', 'boundary', 'border', 'edge', 'fringe', 'zone']):
        return PROXIMITY_SCORES["buffer zone"]

    if any(w in loc for w in ['farm', 'field', 'rice', 'crop', 'agricultural', 'plantation', 'garden', 'orchard', 'banana', 'harvest']):
        return PROXIMITY_SCORES["agricultural"]

    return PROXIMITY_SCORES["urban"]


def _get_density_score(count: int) -> float:
    if count >= 10:
        return 1.0    # Widespread
    elif count >= 5:
        return 0.75   # Established
    elif count >= 2:
        return 0.50   # Small cluster
    return 0.25       # Single sighting


def _save_default_score(report_id: int, session: Session) -> MCTSScore:
    existing = session.exec(
        select(MCTSScore).where(MCTSScore.report_id == report_id)
    ).first()
    if existing:
        return existing

    mcts = MCTSScore(
        report_id=report_id,
        total_score=0.0,
        ecological_impact=0.0,
        spread_rate=0.0,
        detection_frequency=0.0,
        threat_level="low",
    )
    session.add(mcts)
    session.commit()
    session.refresh(mcts)
    return mcts