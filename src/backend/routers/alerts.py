from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List

from src.backend.database import get_db
from src.backend.models import Alert, AuditLog, Incident
from src.backend.schemas import AlertResponse, AlertUpdate, AlertEscalateResponse, HumanReviewRequest
from src.backend.audit_service import create_audit_log

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).order_by(Alert.created_at.desc()).all()

@router.post("/acknowledge-all", response_model=List[AlertResponse])
def acknowledge_all_alerts(db: Session = Depends(get_db)):
    unacked = db.query(Alert).filter(Alert.status.in_(["new", "unacknowledged"])).all()
    for alert in unacked:
        alert.status = "acknowledged"
    if unacked:
        create_audit_log(
            db=db,
            actor="operator",
            action="acknowledge_all_alerts",
            resource=f"alerts_batch:{len(unacked)}",
            outcome="success"
        )
        db.commit()
    return db.query(Alert).order_by(Alert.created_at.desc()).all()

@router.patch("/{alert_id}/acknowledge", response_model=AlertResponse, responses={
    400: {"description": "Alert cannot be acknowledged"},
    404: {"description": "Alert not found"}
})
def acknowledge_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    if alert.status == "acknowledged":
        return alert

    if alert.status not in ["new", "unacknowledged"]:
        raise HTTPException(status_code=400, detail="Alert cannot be acknowledged")
        
    alert.status = "acknowledged"
    
    create_audit_log(
        db=db,
        actor="system",
        action="acknowledge_alert",
        resource=f"alert:{alert.id}",
        outcome="success",
        simulation_id=alert.simulation_id
    )
    db.commit()
    db.refresh(alert)
    return alert

@router.post("/{alert_id}/review", response_model=AlertResponse, responses={
    400: {"description": "Alert cannot be reviewed from current state"},
    404: {"description": "Alert not found"}
})
def review_alert(alert_id: str, request: HumanReviewRequest, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    if alert.status not in ["acknowledged", "escalated"]:
        raise HTTPException(status_code=400, detail="Alert must be acknowledged before review")
        
    alert.review_decision = request.decision
    alert.review_notes = request.notes
    alert.reviewer_id = request.reviewer_id
    
    create_audit_log(
        db=db,
        actor=request.reviewer_id or "operator_01",
        action="human_review",
        resource=f"alert:{alert.id}",
        outcome=request.decision,
        reason=request.notes,
        simulation_id=alert.simulation_id
    )
    db.commit()
    db.refresh(alert)
    return alert

@router.post("/{alert_id}/escalate", response_model=AlertEscalateResponse, responses={
    400: {"description": "Alert cannot be escalated from current state"},
    404: {"description": "Alert not found"}
})
def escalate_alert(alert_id: str, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    if alert.status not in ["new", "acknowledged"]:
        raise HTTPException(status_code=400, detail="Alert cannot be escalated from current state")
        
    alert.status = "escalated"
    
    incident = Incident(
        alert_id=alert.id,
        status="open",
        is_synthetic=True,
        simulation_id=alert.simulation_id
    )
    db.add(incident)
    db.flush()
    
    create_audit_log(
        db=db,
        actor="system",
        action="escalate_alert",
        resource=f"alert:{alert.id}",
        outcome="success",
        simulation_id=alert.simulation_id
    )
    return {"status": "escalated", "incident_id": incident.id}
