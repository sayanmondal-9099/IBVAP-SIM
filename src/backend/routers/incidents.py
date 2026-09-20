from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from src.backend.database import get_db
from src.backend.models import Incident
from src.backend.schemas import IncidentResponse, IncidentResolveRequest
from src.backend.audit_service import create_audit_log

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])

@router.get("", response_model=List[IncidentResponse])
def get_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.created_at.desc()).all()

@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.post("/{incident_id}/resolve", response_model=IncidentResponse, responses={
    400: {"description": "Incident cannot be resolved from current state"},
    404: {"description": "Incident not found"}
})
def resolve_incident(incident_id: str, request: IncidentResolveRequest, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    if incident.status in ["resolved", "closed"]:
        raise HTTPException(status_code=400, detail="Incident is already resolved or closed")
        
    incident.status = "resolved"
    incident.resolution = request.resolution
    incident.resolution_notes = request.notes
    
    create_audit_log(
        db=db,
        actor="operator_01",
        action="resolve_incident",
        resource=f"incident:{incident.id}",
        outcome=request.resolution,
        reason=request.notes
    )
    db.commit()
    db.refresh(incident)
    return incident
